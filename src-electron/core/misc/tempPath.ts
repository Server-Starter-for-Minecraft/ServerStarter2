import { genUUID } from 'app/src-electron/tools/uuid';
import { tempPath } from '../const';

export async function allocateTempDir() {
  const dir = tempPath.child(genUUID());
  await dir.mkdir(true);
  return dir;
}
