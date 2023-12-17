import { Path } from 'app/src-electron/util/path';
import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import {
  PlayerUUID,
  WorldContainer,
  WorldName,
} from 'app/src-electron/schema/brands';
import {
  WorldDirectoryTypes,
  WorldSettings,
  serverJsonFile,
} from './files/json';
import { serverIconFile } from './files/icon';
import { serverPropertiesFile } from './files/properties';
import { Ops, serverOpsFile } from './files/ops';
import { Whitelist, serverWhitelistFile } from './files/whitelist';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { withError } from 'app/src-electron/util/error/witherror';
import { serverAllAdditionalFiles } from './files/addtional/all';
import { errorMessage } from '../../util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import { Version } from 'app/src-electron/schema/version';
import {
  LEVEL_NAME,
  PLUGIN_NETHER_LEVEL_NAME,
  PLUGIN_THE_END_LEVEL_NAME,
} from '../const';
import { asyncForEach, asyncMap } from 'app/src-electron/util/objmap';
import { importCustomMap } from './cusomMap';
import { pullRemoteWorld } from '../remote/remote';
import { GroupProgressor } from '../progress/progress';

function toPlayers(ops: Ops, whitelist: Whitelist): PlayerSetting[] {
  const map: Record<PlayerUUID, PlayerSetting> = {};

  whitelist.forEach(({ uuid, name }) => (map[uuid] = { uuid, name }));

  ops.forEach(
    ({ uuid, name, level, bypassesPlayerLimit }) =>
      (map[uuid] = {
        uuid,
        name,
        op: {
          level,
          bypassesPlayerLimit,
        },
      })
  );

  return Object.values(map);
}

function fromPlayers(players: PlayerSetting[]): [Ops, Whitelist] {
  const whitelist: Whitelist = [];
  const ops: Ops = [];

  players.forEach(({ uuid, name, op }) => {
    whitelist.push({ uuid, name });
    if (op !== undefined) {
      ops.push({ uuid, name, ...op });
    }
  });

  return [ops, whitelist];
}
// ローカルのサーバーディレクトリからWorld情報を取得
export async function loadLocalFiles(
  savePath: Path,
  id: WorldID,
  name: WorldName,
  container: WorldContainer
): Promise<WithError<Failable<World>>> {
  // server_settings.json
  // server.properties
  // world/icon.png
  // を並列読み込み
  const [
    worldSettings,
    properties,
    _avater_path,
    _ops,
    _whitelist,
    additional,
  ] = await Promise.all([
    serverJsonFile.load(savePath),
    serverPropertiesFile.load(savePath),
    serverIconFile.load(savePath),
    serverOpsFile.load(savePath),
    serverWhitelistFile.load(savePath),
    serverAllAdditionalFiles.load(savePath, id),
  ]);
  const errors: ErrorMessage[] = [];

  errors.push(...additional.errors);

  // worldSettingsJsonが読み込めなかった場合はエラー
  if (isError(worldSettings)) return withError(worldSettings, errors);

  let players: World['players'];

  // opsとwhitelistが両方読み込めた場合のみplayersを有効化
  if (isValid(_ops) && isValid(_whitelist)) {
    players = toPlayers(_ops, _whitelist);
  } else {
    if (isError(_ops)) {
      players = errorMessage.data.path.invalidContent.invalidOpsJson({
        type: 'file',
        path: serverOpsFile.path(savePath).path,
      });
    } else {
      players = errorMessage.data.path.invalidContent.invalidWhitelistJson({
        type: 'file',
        path: serverWhitelistFile.path(savePath).path,
      });
    }
  }

  // avater_pathが読み込めなかった場合は未設定にする
  const avater_path = isValid(_avater_path) ? _avater_path : undefined;

  // worldオブジェクトを生成
  const world: World = {
    id,
    name,
    container,
    avater_path,
    version: worldSettings.version,
    using: worldSettings.using,
    remote: worldSettings.remote,
    last_date: worldSettings.last_date,
    last_user: worldSettings.last_user,
    last_id: worldSettings.last_id,
    memory: worldSettings.memory,
    additional: additional.value,
    properties,
    players,
    useNgrok: worldSettings.useNgrok,
  };

  return withError(world, errors);
}

/** ローカルのサーバーディレクトリにWorld情報を保存
 * 戻り値は保存結果(保存の成否によって引数の値と異なる可能性あり) */
export async function saveLocalFiles(
  savePath: Path,
  world: WorldEdited
): Promise<WithError<Failable<World>>> {
  let worldSettings = constructWorldSettings(world);

  const errors: ErrorMessage[] = [];

  async function constructResult() {
    // ローカルのデータを再読み込み
    const result = await loadLocalFiles(
      savePath,
      world.id,
      world.name,
      world.container
    );
    result.errors.push(...errors);
    return result;
  }

  // カスタムマップの導入処理
  // TODO: メソッドを分割すべき
  if (world.custom_map) {
    // ファイル削除待機
    await asyncForEach(
      [PLUGIN_NETHER_LEVEL_NAME, PLUGIN_THE_END_LEVEL_NAME],
      (path) => savePath.child(path).remove()
    );

    // 導入待機
    const importResult = await importCustomMap(
      world.custom_map,
      savePath,
      worldSettings
    );

    // 導入に失敗した場合
    if (isError(importResult)) errors.push(importResult);
    else {
      world.avater_path = world.custom_map.icon ?? world.avater_path;

      worldSettings = importResult.settings;
      if (importResult.properties === undefined) {
        // 配布マップにserver.propertiesの情報が含まれていない場合
        // gamemode/difficulty/hardcoreをローカスのデータで上書き
        if (isValid(world.properties)) {
          world.properties.gamemode = world.custom_map.gamemode;
          world.properties.difficulty = world.custom_map.difficulty;
          world.properties.hardcore = world.custom_map.hardcore;
        }
      } else {
        // 配布マップにserver.propertiesの情報が含まれていた場合
        if (isValid(world.properties)) {
          // 元のserver.propertiesとマージ
          world.properties = {
            ...world.properties,
            ...importResult.properties,
          };
        } else {
          // server.propertiesを上書き
          world.properties = importResult.properties;
        }
      }
    }
  }

  // リモートワールドの導入処理
  if (world.remote_source) {
    const pull = await pullRemoteWorld(savePath, world.remote_source);
    if (isError(pull)) errors.push(pull);
  }

  const promisses: Promise<any>[] = [
    serverJsonFile.save(savePath, worldSettings),
    serverIconFile.save(savePath, world.avater_path),
    serverAllAdditionalFiles
      .save(savePath, world.additional)
      .then((v) => errors.push(...v.errors)),
  ];

  // world.playersが正常値の場合ファイル(ops.json,whitelist.json)に保存
  if (isValid(world.players)) {
    const [ops, whitelist] = fromPlayers(world.players);
    promisses.push(
      serverOpsFile.save(savePath, ops),
      serverWhitelistFile.save(savePath, whitelist)
    );
  }

  // world.propertiesが正常値の場合ファイル(server.properties)に保存
  if (isValid(world.properties)) {
    promisses.push(serverPropertiesFile.save(savePath, world.properties));
  }

  await Promise.all(promisses);

  // ローカルのデータを再読み込みして返却
  return constructResult();
}

export function constructWorldSettings(world: World | WorldEdited) {
  const worldSettings: WorldSettings = {
    memory: world.memory,
    javaArguments: world.javaArguments,
    version: world.version,
    remote: world.remote,
    last_date: world.last_date,
    last_user: world.last_user,
    last_id: world.last_id,
    using: world.using,
    useNgrok: world.useNgrok,
  };
  return worldSettings;
}

const VANILLA_NETHER_DIM = LEVEL_NAME + '/DIM-1';
const VANILLA_THE_END_DIM = LEVEL_NAME + '/DIM1';

const PLUGIN_NETHER_DIM = LEVEL_NAME + '_nether/DIM-1';
const PLUGIN_THE_END_DIM = LEVEL_NAME + '_the_end/DIM1';

/** ワールドのディレクトリが vanilla | plugin のどちらかを推定する
 * world_nether/DIM-1, world_the_end/DIM-1 のどちらかが存在する場合は plugin
 * それ以外はvanilla */
function estimateWorldDirectoryType(savePath: Path): WorldDirectoryTypes {
  const nether = savePath.child('world_nether/DIM-1');
  if (nether.exists()) return 'plugin';
  const the_end = savePath.child('world_the_end/DIM1');
  if (the_end.exists()) return 'plugin';
  return 'vanilla';
}

/** 起動するVersion(type)に合わせてワールドのセーブデータの構成を変更する */
export async function formatWorldDirectory(
  savePath: Path,
  version: Version,
  progress?: GroupProgressor
): Promise<WithError<undefined>> {
  const directoryTypeMap: Record<Version['type'], WorldDirectoryTypes> = {
    vanilla: 'vanilla',
    spigot: 'plugin',
    papermc: 'plugin',
    forge: 'vanilla',
    mohistmc: 'plugin',
    fabric: 'vanilla',
  };
  const next = directoryTypeMap[version.type];

  const current = estimateWorldDirectoryType(savePath);
  if (current === next) return withError(undefined);

  const vanillaNether = savePath.child(VANILLA_NETHER_DIM);
  const vanillaEnd = savePath.child(VANILLA_THE_END_DIM);
  const pluginNether = savePath.child(PLUGIN_NETHER_DIM);
  const pluginEnd = savePath.child(PLUGIN_THE_END_DIM);

  progress?.title({ key: 'server.run.before.convertDirectory' });
  switch (true) {
    case current === 'vanilla' && next === 'plugin':
      await asyncMap(
        [
          { from: vanillaNether, to: pluginNether },
          { from: vanillaEnd, to: pluginEnd },
        ],
        ({ from, to }) => from.moveTo(to)
      );
      return withError(undefined);
    case current === 'plugin' && next === 'vanilla':
      await asyncMap(
        [
          { from: pluginNether, to: vanillaNether },
          { from: pluginEnd, to: vanillaEnd },
        ],
        ({ from, to }) => from.moveTo(to)
      );
      return withError(undefined);
    default:
      throw new Error(
        `not implemanted worldDirectoryType conversion: ${current} to ${next}`
      );
  }
}
