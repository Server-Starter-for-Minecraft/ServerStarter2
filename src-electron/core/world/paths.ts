import { WorldID } from 'app/src-electron/schema/world';
import { WorldHandler } from './handler';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/schema/error';
import { LEVEL_NAME } from '../const';

type WorldPathTypes = 'base' | 'datapacks' | 'plugins' | 'mods';

/** WorldIDと欲しいパスの種類を受け取って、パス文字列を返す */
export async function getWorldPaths(
  world: WorldID,
  type: WorldPathTypes
): Promise<Failable<string>> {
  const worldHandler = WorldHandler.get(world);

  if (isError(worldHandler)) return worldHandler;

  const path = worldHandler.getSavePath();

  switch (type) {
    case 'base':
      return path.str();
    case 'datapacks':
      return path.child(LEVEL_NAME + '/datapacks').str();
    case 'mods':
      return path.child('mods').str();
    case 'plugins':
      return path.child('plugins').str();
  }
}
