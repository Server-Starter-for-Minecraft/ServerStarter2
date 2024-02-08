import { Path } from 'app/src-electron/util/path';
import { JsonFileHandler } from '../base/handler';
import { WorldSettings$1 } from './schema/setting';

export const getWorldSettingsHandler = (path: Path) =>
  new JsonFileHandler(path, WorldSettings$1);
