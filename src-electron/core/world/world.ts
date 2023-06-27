import {
  Failable,
  failabilify,
  isFailure,
  isSuccess,
  runOnSuccess,
} from 'src-electron/api/failable';
import { Path } from '../../util/path';
import { asyncMap } from '../../util/objmap';
import { NEW_WORLD_NAME } from '../const';
import { worldContainerToPath } from './worldContainer';
import {
  World,
  WorldAbbr,
  WorldEdited,
  WorldID,
} from 'src-electron/schema/world';
import { genUUID } from 'src-electron/tools/uuid';
import { WorldLocationMap, wroldLocationToPath } from './worldMap';
import { WorldContainer, WorldName } from 'src-electron/schema/brands';
import { vanillaVersionLoader } from '../version/vanilla';
import { getSystemSettings } from '../stores/system';
import { WorldHandler } from './handler';
import { WithError, withError } from 'app/src-electron/api/witherror';
import { validateNewWorldName } from './name';
import { serverJsonFile } from './files/json';

export async function getWorldAbbrs(
  worldContainer: WorldContainer
): Promise<WithError<Failable<WorldAbbr[]>>> {
  const subdir = await worldContainerToPath(worldContainer).iter();
  const results = await asyncMap(subdir, (x) =>
    getWorldAbbr(x, worldContainer)
  );
  return withError(results.filter(isSuccess), results.filter(isFailure));
}

export async function getWorldAbbr(
  path: Path,
  worldContainer: WorldContainer
): Promise<Failable<WorldAbbr>> {
  console.log(path.path);
  if (!path.isDirectory()) return new Error(`${path.str()} is not directory.`);
  const jsonpath = serverJsonFile.path(path);

  if (!jsonpath.exists()) return new Error(`${jsonpath.str()} not exists.`);

  const name = path.basename() as WorldName;
  const container = worldContainer as WorldContainer;

  // WorldHandlerに登録
  const id = WorldHandler.register(name, container);

  const result: WorldAbbr = {
    id,
    name,
    container,
  };
  WorldLocationMap.set(id, { name, container });

  return result;
}

/** WorldIDからワールドデータ取得 (リモートが存在する場合リモートから読み込む) */
export async function getWorld(
  worldID: WorldID
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(worldID);
  if (isFailure(handler)) return withError(handler);
  return await handler.load();
}

/** WorldIDからワールドデータを更新 (リモートが存在する場合リモートから読み込んだ後にリモートを更新) */
export async function setWorld(
  world: WorldEdited
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(world.id);
  if (isFailure(handler)) return withError(handler);
  return await handler.save(world);
}

/**
 * ワールドデータを新規生成して返す
 * ワールドのidは呼び出すたびに新しくなる
 */
export async function newWorld(): Promise<WithError<Failable<World>>> {
  const vanillaVersions = await vanillaVersionLoader.getAllVersions(true);
  if (isFailure(vanillaVersions)) return withError(vanillaVersions);

  const latestRelease = vanillaVersions.find((ver) => ver.release);

  const systemSettings = await getSystemSettings();

  if (latestRelease === undefined) {
    return withError(new Error('Assertion: This error cannot occur'));
  }

  const container = systemSettings.container.default;
  const name = await getDefaultWorldName(container);

  // WorldHandlerに登録
  const id = WorldHandler.register(name, container);

  const world: World = {
    name,
    container,
    id,
    version: latestRelease,
    using: false,
    remote: undefined,
    last_date: undefined,
    last_user: undefined,
    memory: systemSettings.world.memory,
    javaArguments: systemSettings.world.javaArguments,
    properties: systemSettings.world.properties,
    players: [],
    additional: {
      datapacks: [],
      plugins: [],
      mods: [],
    },
  };

  return withError(world);
}

/** 新規作成する際のワールド名を取得 */
async function getDefaultWorldName(container: WorldContainer) {
  let worldName = NEW_WORLD_NAME;

  let result = await validateNewWorldName(container, worldName);
  let i = 0;
  while (isFailure(result)) {
    worldName = `${NEW_WORLD_NAME}_${i}`;
    i += 1;
    console.log(99, result, worldName);
    result = await validateNewWorldName(container, worldName);
    console.log(100, result);
  }
  return result;
}

/**
 * ワールドデータ(ディレクトリとfile)を生成する
 * 注：newWorld()によって生成されたものに限る
 */
export async function createWorld(
  world: WorldEdited
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(world.id);
  if (isFailure(handler)) return withError(handler);
  return await handler.create(world);
}

/**
 * ワールドデータを削除する
 */
export async function deleteWorld(
  worldID: WorldID
): Promise<WithError<Failable<undefined>>> {
  const handler = WorldHandler.get(worldID);
  console.log(handler);
  if (isFailure(handler)) return withError(handler);
  return await handler.delete();
}
