import {
  Failable,
  failabilify,
  isFailure,
  isSuccess,
  runOnSuccess,
} from 'src-electron/api/failable';
import { Path } from '../../util/path';
import { asyncMap } from '../../util/objmap';
import { getWorldJsonPath, loadWorldJson } from '../settings/worldJson';
import { BytesData } from '../../util/bytesData';
import { LEVEL_NAME } from '../const';
import { getRemoteWorld } from '../remote/remote';
import { worldContainerToPath } from './worldContainer';
import { worldSettingsToWorld } from '../settings/converter';
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

export async function deleteWorld(worldID: WorldID) {
  const cwd = runOnSuccess(wroldLocationToPath)(WorldLocationMap.get(worldID));
  if (isFailure(cwd)) return cwd;

  const result = await failabilify(cwd.remove)();
  if (isFailure(result)) return result;

  WorldLocationMap.delete(worldID);
  return;
}

export async function getWorldAbbrs(
  worldContainer: WorldContainer
): Promise<Failable<WorldAbbr[]>> {
  const subdir = await worldContainerToPath(worldContainer).iter();
  const results = await asyncMap(subdir, (x) =>
    getWorldAbbr(x, worldContainer)
  );
  return results.filter(isSuccess);
}

export async function getWorldAbbr(
  path: Path,
  worldContainer: WorldContainer
): Promise<Failable<WorldAbbr>> {
  console.log(path.path);
  if (!path.isDirectory()) return new Error(`${path.str()} is not directory.`);
  const jsonpath = getWorldJsonPath(path);

  if (!jsonpath.exists()) return new Error(`${jsonpath.str()} not exists.`);

  const id = genUUID() as WorldID;
  const name = path.basename() as WorldName;
  const container = worldContainer as WorldContainer;
  const result: WorldAbbr = {
    id,
    name,
    container,
  };
  WorldLocationMap.set(id, { name, container });

  // WorldHandlerに登録
  WorldHandler.register(id, name, container);

  return result;
}

/** WorldIDからワールドデータ取得 (リモートが存在する場合リモートから読み込む) */
export async function getWorld(worldID: WorldID): Promise<Failable<World>> {
  const handler = WorldHandler.get(worldID);
  if (isFailure(handler)) return handler;
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
export async function getDefaultWorld() {
  const vanillaVersions = await vanillaVersionLoader.getAllVersions(true);
  if (isFailure(vanillaVersions)) return vanillaVersions;

  const latestRelease = vanillaVersions.find((ver) => ver.release);

  const systemSettings = await getSystemSettings();

  if (latestRelease === undefined)
    return new Error('Assertion: This error cannot occur');

  const world: World = {
    // TODO: NewWorldが使用済みの場合末尾に"(n)"を追加
    name: 'NewWorld' as WorldName,
    container: systemSettings.container.default,
    id: genUUID() as WorldID,
    version: latestRelease,
    using: false,
    remote: undefined,
    last_date: undefined,
    last_user: undefined,
    memory: systemSettings.world.memory,
    javaArguments: systemSettings.world.javaArguments,
    properties: systemSettings.world.properties,
    players: [],
    additional: {},
  };

  return world;
}
