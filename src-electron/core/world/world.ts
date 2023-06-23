import {
  Failable,
  failabilify,
  isFailure,
  isSuccess,
  runOnSuccess,
} from 'src-electron/api/failable';
import { Path } from '../../util/path';
import { asyncMap, objMap } from '../../util/objmap';
import { getWorldJsonPath, loadWorldJson } from '../settings/worldJson';
import { BytesData } from '../../util/bytesData';
import { LEVEL_NAME } from '../const';
import { getRemoteWorld } from '../remote/remote';
import { worldContainerToPath } from './worldContainer';
import { worldSettingsToWorld } from '../settings/converter';
import { World, WorldAbbr, WorldID } from 'src-electron/schema/world';
import { genUUID } from 'src-electron/tools/uuid';
import { WorldLocationMap, wroldLocationToPath } from './worldMap';
import { WorldContainer, WorldName } from 'src-electron/schema/brands';
import { vanillaVersionLoader } from '../version/vanilla';
import { getSystemSettings } from '../stores/system';
import {
  ServerProperties,
  ServerPropertiesMap,
} from 'app/src-electron/schema/serverproperty';

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
  return result;
}

export async function getWorld(worldID: WorldID): Promise<Failable<World>> {
  const location = WorldLocationMap.get(worldID);
  if (isFailure(location)) return location;
  const { name, container } = location;

  const cwd = wroldLocationToPath(location);
  if (isFailure(cwd)) return cwd;

  const settings = await loadWorldJson(cwd);
  if (isFailure(settings)) return settings;

  // リモートが存在する場合リモートからデータを取得
  if (settings.remote !== undefined) {
    const result = await getRemoteWorld(worldID, settings.remote);
    return result;
  }

  // リモートが存在しない場合ローカルのデータを使用

  // アバターの読み込み
  const avater_path = await getIconURI(cwd);

  settings.properties ?? {};
  const world = worldSettingsToWorld({
    id: worldID,
    name,
    container,
    avater_path,
    settings,
  });
  return world;
}

async function getIconURI(cwd: Path) {
  let iconURI: string | undefined = undefined;
  const iconpath = cwd.child(LEVEL_NAME + '/icon.png');
  if (iconpath.exists()) {
    const data = await BytesData.fromPath(iconpath);
    if (isSuccess(data)) {
      iconURI = await data.encodeURI('image/png');
    }
  }
  return iconURI;
}

function propertiesToMap(properties: ServerProperties): ServerPropertiesMap {
  return objMap(properties, (k, v) => [k, v.value]);
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
    remote_pull: undefined,
    remote_push: undefined,
    last_date: undefined,
    last_user: undefined,
    memory: systemSettings.world.memory,
    javaArguments: systemSettings.world.javaArguments,
    properties: propertiesToMap(systemSettings.world.properties),
    players: [],
    additional: {},
  };

  return world;
}
