import { Path } from 'app/src-electron/util/path';
import { JsonFileHandler } from '../base/handler';
import { WorldSettings$1 } from './schema/setting';

const a = (path: Path) =>
  new JsonFileHandler<WorldSettings$1>(path, WorldSettings$1);
