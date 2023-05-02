import { isAbsolute } from 'path';
import { Path } from 'src-electron/util/path';
import { mainPath } from '../const';
import { WorldContainers } from 'app/src-electron/api/schema';
import { systemSettings } from '../stores/system';

export async function getWorldContainers(): Promise<WorldContainers> {
  console.log('container', systemSettings.get('container'));
  return systemSettings.get('container');
}

export async function setWorldContainers(
  worldContainers: WorldContainers
): Promise<void> {
  systemSettings.set('container', worldContainers);
}

// world.containerが相対パスの場合mainpathからの相対パスとして処理
export function worldContainerToPath(worldContainer: string): Path {
  return isAbsolute(worldContainer)
    ? new Path(worldContainer)
    : mainPath.child(worldContainer);
} 
