import { Path } from 'app/src-electron/util/path';
import { JsonFileHandler } from '../base/handler';
import { WorldSettings$1 } from '../schama/worldSetting';

export const getWorldSettingsHandler = (path: Path) =>
  new JsonFileHandler(path, WorldSettings$1);
