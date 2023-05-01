import { isAbsolute } from 'path';
import { WORLD_CONTAINERS_KEY, serverStarterSetting } from '../stores/setting';
import { Path } from 'src-electron/util/path';
import { mainPath } from '../const';
import { WorldContainers } from 'app/src-electron/api/schema';

export async function getWorldContainers(): Promise<WorldContainers> {
  let containers = serverStarterSetting.get(WORLD_CONTAINERS_KEY);

  if (typeof containers !== 'object')
    containers = {
      default: 'servers',
      custom: {},
    };

  if (containers.default === undefined) containers.default = 'servers';
  if (!containers.custom === undefined) containers.custom = {};

  await setWorldContainers(containers);
  return containers;
}

export async function setWorldContainers(
  worldContainers: WorldContainers
): Promise<void> {
  serverStarterSetting.set(WORLD_CONTAINERS_KEY, worldContainers);
}

// world.containerが相対パスの場合mainpathからの相対パスとして処理
export function worldContainerToPath(worldContainer: string): Path {
  return isAbsolute(worldContainer)
    ? new Path(worldContainer)
    : mainPath.child(worldContainer);
}
