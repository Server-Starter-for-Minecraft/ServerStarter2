import { Path } from 'app/src-electron/util/path';
import { Failable, isFailure, isSuccess } from 'app/src-electron/api/failable';
import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import {
  PlayerUUID,
  WorldContainer,
  WorldName,
} from 'app/src-electron/schema/brands';
import { WorldSettings, serverJsonFile } from './files/json';
import { serverIconFile } from './files/icon';
import { serverPropertiesFile } from './files/properties';
import { Ops, serverOpsFile } from './files/ops';
import { Whitelist, serverWhitelistFile } from './files/whitelist';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { WithError, withError } from 'app/src-electron/api/witherror';
import { serverAllAdditionalFiles } from './files/addtional/all';
import { errorMessage, isErrorMessage, isValidValue } from '../error/construct';

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
    _properties,
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
    serverAllAdditionalFiles.load(savePath),
  ]);
  const errors: Error[] = [];

  errors.push(...additional.errors);

  // worldSettingsJsonが読み込めなかった場合はエラー
  if (isFailure(worldSettings)) return withError(worldSettings, errors);

  // serverPropertiesが読み込めた場合はpropertiesを有効化
  const properties = isSuccess(_properties)
    ? _properties
    : errorMessage.failLoading({
        path: serverPropertiesFile.path(savePath).path,
        contentType: 'properties',
      });

  let players: World['players'];

  // opsとwhitelistが両方読み込めた場合のみplayersを有効化
  if (isSuccess(_ops) && isSuccess(_whitelist)) {
    players = toPlayers(_ops, _whitelist);
  } else {
    if (isFailure(_ops)) {
      players = errorMessage.failLoading({
        path: serverOpsFile.path(savePath).path,
        contentType: 'ops',
      });
    } else {
      players = errorMessage.failLoading({
        path: serverWhitelistFile.path(savePath).path,
        contentType: 'whitelist',
      });
    }
  }

  // avater_pathが読み込めなかった場合は未設定にする
  let avater_path = isSuccess(_avater_path) ? _avater_path : undefined;

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

  return withError(world, errors);
}

/** ローカルのサーバーディレクトリにWorld情報を保存
 * 戻り値は保存結果(保存の成否によって引数の値と異なる可能性あり) */
export async function saveLocalFiles(
  savePath: Path,
  world: WorldEdited
): Promise<WithError<Failable<World>>> {
  const worldSettings = constructWorldSettings(world);

  const errors: Error[] = [];

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
  if (isValidValue(world.players)) {
    const [ops, whitelist] = fromPlayers(world.players);
    promisses.push(
      serverOpsFile.save(savePath, ops),
      serverWhitelistFile.save(savePath, whitelist)
    );
  }

  // world.propertiesが正常値の場合ファイル(server.properties)に保存
  if (isValidValue(world.properties)) {
    promisses.push(serverPropertiesFile.save(savePath, world.properties));
  }

  await Promise.all(promisses);

  // ローカルのデータを再読み込みして返却
  return constructResult();
}

export function constructWorldSettings(world: World) {
  const worldSettings: WorldSettings = {
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
