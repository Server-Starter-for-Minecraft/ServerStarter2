import { Failable, isFailure, isSuccess } from 'src-electron/api/failable';
import { World, WorldAbbr } from 'src-electron/api/schema';
import { userDataPath } from '../../userDataPath';
import { Path } from '../../utils/path/path';
import { asyncMap } from '../../utils/objmap';
import { getWorldJsonPath, loadWorldJson } from './worldJson';
import { getRemoteWorld } from '../remote/remote';

export async function getWorldAbbrs(
  worldContainer: string
): Promise<Failable<WorldAbbr[]>> {
  const subdir = await new Path(worldContainer).iter();
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

export async function getWorld(
  name: string,
  container: string
): Promise<Failable<World>> {
  const cwd = new Path(container).child(name);

  const settings = await loadWorldJson(cwd);
  if (isFailure(settings)) return settings;

  // リモートが存在する場合リモートからデータを取得
  if (settings.remote !== undefined) {
    return await getRemoteWorld(name, container, settings.remote);
  }

  // リモートが存在しない場合ローカルのデータを使用
  const world: World = {
    name,
    container,
    settings,
    additional: {},
  };

  return world;
}

// const demoWorldSettings: WorldSettings = {
//   avater_path: 'https://cdn.quasar.dev/img/parallax2.jpg',
//   version: {
//     id: '1.19.2',
//     type: 'vanilla',
//     release: true,
//   },
// };
