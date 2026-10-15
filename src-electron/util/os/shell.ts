import { shell } from 'electron';
import { Failable } from '../../schema/error';
import { Path } from '../binary/path';
import { errorMessage } from '../error/construct';
import { isError } from '../error/error';
import { safeExecAsync } from '../error/failable';

export function openBrowser(url: string) {
  shell.openExternal(url);
}

/**
 * フォルダをエクスプローラーで開く
 *
 * @param path 開くフォルダのパス
 * @param autocreate trueの場合，フォルダが存在しなければ作成してから開く
 * @returns 失敗した場合はエラー（フォルダの作成・オープン時に発生した例外もエラーとして返す）
 */
export async function openFolder(
  path: string,
  autocreate: boolean
): Promise<Failable<void>> {
  const dirpath = new Path(path);

  // autocreate === false && ディレクトリが存在しない場合にエラー
  if (!autocreate && !dirpath.exists()) {
    return errorMessage.data.path.notFound({
      type: 'directory',
      path: path,
    });
  }

  const mkdirResult = await safeExecAsync(() => dirpath.mkdir(true));
  if (isError(mkdirResult)) {
    return errorMessage.data.path.creationFailed({
      type: 'directory',
      path: path,
    });
  }

  const openResult = await safeExecAsync(() => shell.openPath(path));
  if (isError(openResult)) return openResult;
  if (openResult !== '') {
    return errorMessage.data.path.shellError({
      type: 'directory',
      path: path,
      message: openResult,
    });
  }
}
