import { isAbsolute } from 'path';
import { WORLD_CONTAINERS_KEY, serverStarterSetting } from '../stores/setting';
import { objMap } from '../../util/objmap';
import { mainPath } from '../const';

export async function getWorldContainers() {
  const paths = serverStarterSetting.get(WORLD_CONTAINERS_KEY) ?? {
    default: 'servers',
  };

  return objMap(paths, (key, pathstr) => [
    key,
    isAbsolute(pathstr) ? pathstr : mainPath.child(pathstr).str(),
  ]);
}
