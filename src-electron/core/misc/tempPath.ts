import { genUUID } from 'app/src-electron/tools/uuid';
import { tempPath } from '../const';
import { onQuit } from 'app/src-electron/lifecycle/lifecycle';

export async function allocateTempDir() {
  const dir = tempPath.child(genUUID());
  await dir.mkdir(true);
  // ソフト終了時に削除
  onQuit(async () => dir.remove(true), true);
  return dir;
}
