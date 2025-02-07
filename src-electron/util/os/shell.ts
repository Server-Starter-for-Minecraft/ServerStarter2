import { shell } from 'electron';
import { Failable } from '../../schema/error';
import { Path } from '../binary/path';
import { errorMessage } from '../error/construct';

export function openBrowser(url: string) {
  shell.openExternal(url);
}

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

  await dirpath.mkdir(true);
  const openResult = await shell.openPath(path);
  if (openResult !== '') {
    return errorMessage.data.path.shellError({
      type: 'directory',
      path: path,
      message: openResult,
    });
  }
}
