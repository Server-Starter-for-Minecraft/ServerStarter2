import { isAbsolute } from 'path';
import { Path } from 'src-electron/util/path';
import { mainPath } from '../const';
import { WorldContainer } from 'src-electron/schema/brands';

// world.containerが相対パスの場合mainpathからの相対パスとして処理
export function worldContainerToPath(worldContainer: WorldContainer): Path {
  return isAbsolute(worldContainer)
    ? new Path(worldContainer)
    : mainPath.child(worldContainer);
}
