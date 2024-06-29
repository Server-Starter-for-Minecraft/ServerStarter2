import { Failable } from 'app/src-electron/schema/error';
import { WorldID } from 'app/src-electron/schema/world';
import { isError } from 'app/src-electron/util/error/error';
import { LEVEL_NAME } from '../const';
import { WorldHandler } from './handler';

type WorldPathTypes = 'world' | 'datapacks' | 'plugins' | 'mods' | 'server';

/** WorldIDと欲しいパスの種類を受け取って、パス文字列を返す */
export async function getWorldPaths(
  world: WorldID,
  type: WorldPathTypes
): Promise<Failable<string>> {
  const worldHandler = WorldHandler.get(world);

  if (isError(worldHandler)) return worldHandler;

  const path = worldHandler.getSavePath();

  switch (type) {
    case 'server':
      return path.str();
    case 'world':
      return path.child(LEVEL_NAME).str();
    case 'datapacks':
      return path.child(`${LEVEL_NAME}/datapacks`).str();
    case 'mods':
      return path.child('mods').str();
    case 'plugins':
      return path.child('plugins').str();
  }
}
