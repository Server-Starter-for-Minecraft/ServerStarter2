import { onQuit } from 'app/src-electron/lifecycle/lifecycle';
import { isError } from 'app/src-electron/util/error/error';
import { ignoreError } from 'app/src-electron/util/error/ignore';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { tempPath } from '../source/const';

/** 一時的なディレクトリを確保 */
export async function allocateTempDir() {
  const dir = tempPath.child(genUUID());
  await dir.mkdir(true);
  // ソフト終了時に削除
  onQuit(async () => {
    const removed = await dir.remove();
    if (isError(removed)) {
      ignoreError(
        removed,
        '終了処理中であり通知先がない（一時フォルダは次回以降の削除の対象にもなる）'
      );
    }
  }, true);
  return dir;
}
