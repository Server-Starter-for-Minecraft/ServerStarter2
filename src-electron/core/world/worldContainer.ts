import { isAbsolute } from 'path';
import { Path } from 'src-electron/util/path';
import { mainPath } from '../const';
import { systemSettings } from '../stores/system';
import { WorldContainers } from 'src-electron/schema/system';
import { WorldContainer } from 'src-electron/schema/brands';

export async function getWorldContainers(): Promise<WorldContainers> {
  return systemSettings.get('container');
}

export async function setWorldContainers(
  worldContainers: WorldContainers
): Promise<void> {
  systemSettings.set('container', worldContainers);
}

// world.containerが相対パスの場合mainpathからの相対パスとして処理
export function worldContainerToPath(worldContainer: WorldContainer): Path {
  return isAbsolute(worldContainer)
    ? new Path(worldContainer)
    : mainPath.child(worldContainer);
}
