import { onQuit } from 'app/src-electron/lifecycle/lifecycle';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { tempPath } from '../source/const';

/** 一時的なディレクトリを確保 */
export async function allocateTempDir() {
  const dir = tempPath.child(genUUID());
  await dir.mkdir(true);
  // ソフト終了時に削除
  onQuit(async () => dir.remove(), true);
  return dir;
}
