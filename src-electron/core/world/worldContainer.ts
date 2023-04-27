import { isAbsolute } from 'path';
import { WORLD_CONTAINERS_KEY, serverStarterSetting } from '../stores/setting';
import { Path } from 'app/src-electron/util/path';
import { mainPath } from '../const';

export async function getWorldContainers(): Promise<Record<string, string>> {
  const paths = serverStarterSetting.get(WORLD_CONTAINERS_KEY) ?? {
    default: 'servers',
  };

  return paths;
}

export async function setWorldContainers(
  worldContainers: Record<string, string>
) {
  serverStarterSetting.set(WORLD_CONTAINERS_KEY, worldContainers);
}

// world.containerが相対パスの場合mainpathからの相対パスとして処理
export function worldContainerToPath(worldContainer: string): Path {
  return isAbsolute(worldContainer)
    ? new Path(worldContainer)
    : mainPath.child(worldContainer);
}
