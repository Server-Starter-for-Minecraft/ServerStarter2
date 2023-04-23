import { isAbsolute } from 'path';
import { serverStarterSetting } from '../setting';
import { userDataPath } from '../userDataPath';

export async function getWorldContainers() {
  const paths = serverStarterSetting.get('world_containers') ?? ['servers'];

  return paths.map((pathstr) =>
    isAbsolute(pathstr) ? pathstr : userDataPath.child(pathstr).str()
  );
}
