import { isAbsolute } from 'path';
import { serverStarterSetting } from '../setting';
import { userDataPath } from '../userDataPath';
import { objMap } from '../utils/objmap';

export async function getWorldContainers() {
  const paths = serverStarterSetting.get('world_containers') ?? {
    default: 'servers',
  };

  return objMap(paths, (key, pathstr) => [
    key,
    isAbsolute(pathstr) ? pathstr : userDataPath.child(pathstr).str(),
  ]);
}
