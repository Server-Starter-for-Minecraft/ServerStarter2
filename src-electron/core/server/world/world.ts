import { Failable, isFailure, isSuccess } from 'app/src-electron/api/failable';
import { World, WorldAbbr } from 'app/src-electron/api/schema';
import { userDataPath } from '../../userDataPath';
import { Path } from '../../utils/path/path';
import { asyncMap } from '../../utils/objmap';
import { getWorldJsonPath, loadWorldJson } from './worldJson';

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

export async function getWorld(name: string, container: string) {
  const cwd = new Path(container).child(name);

  const setting = await loadWorldJson(cwd);
  if (isFailure(setting)) return setting;

  if (setting.remote !== undefined) {
  }

  const world: World = {
    name,
    container,
    version: setting.version,
    settings: {
      memory: setting.memory,
    },
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
