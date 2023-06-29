import { Path } from 'app/src-electron/util/path';
import { Failable } from 'app/src-electron/util/error/failable';
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
import { WithError, withError } from 'app/src-electron/util/error/witherror';
import { serverAllAdditionalFiles } from './files/addtional/all';
import { errorMessage } from '../../util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { ErrorMessage } from 'app/src-electron/schema/error';
import { Version } from 'app/src-electron/schema/version';
import { LEVEL_NAME } from '../const';
import { asyncMap } from 'app/src-electron/util/objmap';

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

export type LocalWorldResult = { world: World; other: WorldSettingsOther };

// ローカルのサーバーディレクトリからWorld情報を取得
export async function loadLocalFiles(
  savePath: Path,
  id: WorldID,
  name: WorldName,
  container: WorldContainer
): Promise<WithError<Failable<LocalWorldResult>>> {
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

  const other = constructWorldSettingsOther(worldSettings);

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
    memory: worldSettings.memory,
    additional: additional.value,
    properties,
    players,
  };

  return withError({ world, other }, errors);
}

/** ローカルのサーバーディレクトリにWorld情報を保存
 * 戻り値は保存結果(保存の成否によって引数の値と異なる可能性あり) */
export async function saveLocalFiles(
  savePath: Path,
  world: WorldEdited,
  other: WorldSettingsOther
): Promise<WithError<Failable<LocalWorldResult>>> {
  const worldSettings = constructWorldSettings(world, other);

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

  // TODO: カスタムマップの導入処理
  // カスタムマップが設定されている場合はその他のプロパティの上書きは同時に発生しない
  if (world.custom_map) {
    // ローカルのデータを再読み込みして返却
    return constructResult();
  }

  // TODO: リモートワールドの導入処理
  // リモートワールドが設定されている場合はその他のプロパティの上書きは同時に発生しない
  if (world.remote_source) {
    // ローカルのデータを再読み込みして返却
    return constructResult();
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

// ワールド設定として存在するが、API経由で公開しない設定群
export type WorldSettingsOther = Omit<
  WorldSettings,
  keyof (World & WorldEdited)
>;

export function getNewWorldSettingsOther(): WorldSettingsOther {
  return {};
}

export function constructWorldSettings(
  world: World | WorldEdited,
  other: WorldSettingsOther
) {
  const worldSettings: WorldSettings = {
    ...other,
    memory: world.memory,
    javaArguments: world.javaArguments,
    version: world.version,
    remote: world.remote,
    last_date: world.last_date,
    last_user: world.last_user,
    using: world.using,
  };
  return worldSettings;
}

export function constructWorldSettingsOther(
  settings: WorldSettings
): WorldSettingsOther {
  return {
    directoryType: settings.directoryType,
  };
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
  current: WorldDirectoryTypes | undefined,
  version: Version
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

  current = current ?? estimateWorldDirectoryType(savePath);
  if (current === next) return withError(undefined);

  const vanillaNether = savePath.child(VANILLA_NETHER_DIM);
  const vanillaEnd = savePath.child(VANILLA_THE_END_DIM);
  const pluginNether = savePath.child(PLUGIN_NETHER_DIM);
  const pluginEnd = savePath.child(PLUGIN_THE_END_DIM);

  switch ([current, next]) {
    case ['vanilla', 'plugin']:
      await asyncMap(
        [
          { from: vanillaNether, to: pluginNether },
          { from: vanillaEnd, to: pluginEnd },
        ],
        ({ from, to }) => from.moveTo(to)
      );
      return withError(undefined);
    case ['plugin', 'vanilla']:
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
