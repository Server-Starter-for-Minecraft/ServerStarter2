import { Failable, isFailure, isSuccess } from 'src-electron/api/failable';
import {
  World,
  WorldAbbr,
} from 'src-electron/api/schema';
import { Path } from '../../util/path';
import { asyncMap} from '../../util/objmap';
import { getWorldJsonPath, loadWorldJson } from './worldJson';
import { BytesData } from '../../util/bytesData';
import { LEVEL_NAME } from '../const';
import { getRemoteWorld } from '../remote/remote';
import { worldContainerToPath } from './worldContainer';
import { worldSettingsToWorld } from '../settings/converter';

// TODO: datapacks/plugins/modsの読み込み

export async function getWorldAbbrs(
  worldContainer: string
): Promise<Failable<WorldAbbr[]>> {
  const subdir = await worldContainerToPath(worldContainer).iter();
  const results = await asyncMap(subdir, (x) =>
    getWorldAbbr(x, worldContainer)
  );
  return results.filter(isSuccess);
}

export async function getWorldAbbr(
  path: Path,
  worldContainer: string
): Promise<Failable<WorldAbbr>> {
  if (!path.isDirectory()) return new Error(`${path.str()} is not directory.`);
  const jsonpath = getWorldJsonPath(path);

  if (!jsonpath.exists()) return new Error(`${jsonpath.str()} not exists.`);

  const result: WorldAbbr = {
    name: path.basename(),
    container: worldContainer,
  };
  return result;
}

export async function getWorld(worldAbbr: WorldAbbr): Promise<Failable<World>> {
  const { container, name } = worldAbbr;
  const cwd = worldContainerToPath(container).child(name);

  const settings = await loadWorldJson(cwd);
  if (isFailure(settings)) return settings;

  // リモートが存在する場合リモートからデータを取得
  if (settings.remote !== undefined) {
    const result = await getRemoteWorld(name, container, settings.remote);
    return result;
  }

  // リモートが存在しない場合ローカルのデータを使用

  // アバターの読み込み
  const avater_path = await getIconURI(cwd);

  settings.properties ?? {};
  const world = worldSettingsToWorld({
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

// const demoWorldSettings: WorldSettings = {
//   avater_path: 'https://cdn.quasar.dev/img/parallax2.jpg',
//   version: {
//     id: '1.19.2',
//     type: 'vanilla',
//     release: true,
//   },
// };
