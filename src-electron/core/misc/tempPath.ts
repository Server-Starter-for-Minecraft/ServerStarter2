import { genUUID } from 'app/src-electron/tools/uuid';
import { tempPath } from '../const';

export function allocateTempDir() {
  return tempPath.child(genUUID());
}
