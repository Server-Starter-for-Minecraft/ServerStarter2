import { Path } from 'app/src-electron/util/path';
import { isFailure, isSuccess } from 'app/src-electron/api/failable';
import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import {
  PlayerUUID,
  WorldContainer,
  WorldName,
} from 'app/src-electron/schema/brands';
import { WorldSettings, serverJsonFile } from './settings/json';
import { serverIconFile } from './settings/icon';
import { serverPropertiesFile } from './settings/properties';
import { Ops, serverOpsFile } from './settings/ops';
import { Whitelist, serverWhitelistFile } from './settings/whitelist';
import { PlayerSetting } from 'app/src-electron/schema/player';

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

export async function loadLocalFiles(
  savePath: Path,
  id: WorldID,
  name: WorldName,
  container: WorldContainer
) {
  // server_settings.json
  // server.properties
  // world/icon.png
  // を並列読み込み
  const [worldSettings, properties, icon, ops, whitelist] = await Promise.all([
    serverJsonFile.load(savePath),
    serverPropertiesFile.load(savePath),
    serverIconFile.load(savePath),
    serverOpsFile.load(savePath),
    serverWhitelistFile.load(savePath),
  ]);

  if (isFailure(worldSettings)) return worldSettings;
  if (isFailure(properties)) return properties;
  if (isFailure(ops)) return ops;
  if (isFailure(whitelist)) return whitelist;

  const avater_path = isSuccess(icon) ? icon : undefined;

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
    additional: {},
    properties,
    players: toPlayers(ops, whitelist),
  };

  return world;
}

export async function saveLocalFiles(savePath: Path, world: WorldEdited) {
  const worldSettings: WorldSettings = {
    memory: world.memory,
    javaArguments: world.javaArguments,
    version: world.version,
    remote: world.remote,
    last_date: world.last_date,
    last_user: world.last_user,
    using: world.using,
  };

  const [ops, whitelist] = fromPlayers(world.players);

  await Promise.all([
    serverJsonFile.save(savePath, worldSettings),
    serverPropertiesFile.save(savePath, world.properties),
    world.avater_path
      ? serverIconFile.save(savePath, world.avater_path)
      : undefined,
    serverOpsFile.save(savePath, ops),
    serverWhitelistFile.save(savePath, whitelist),
  ]);
}
