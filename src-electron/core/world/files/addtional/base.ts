import { Failable } from 'app/src-electron/util/error/failable';
import { WithError, withError } from 'app/src-electron/util/error/witherror';
import { FileData } from 'app/src-electron/schema/filedata';
import { asyncForEach, asyncMap } from 'app/src-electron/util/objmap';
import { Path } from 'app/src-electron/util/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { ErrorMessage } from 'app/src-electron/schema/error';

export type ServerAdditionalFiles<T extends FileData> = {
  load(cwdPath: Path): Promise<WithError<T[]>>;
  save(
    cwdPath: Path,
    value: (T & { path?: string })[]
  ): Promise<WithError<void>>;
  path(cwdPath: Path): Path;
};

export async function loadAdditionalFiles<T extends FileData>(
  dirPath: Path,
  loader: (path: Path) => Promise<Failable<T | undefined>>
) {
  const loaded = await asyncMap(await dirPath.iter(), loader);

  return withError(
    loaded.filter((x): x is T => x !== undefined && isValid(x)),
    loaded.filter(isError)
  );
}

export async function saveAdditionalFiles<T extends FileData>(
  dirPath: Path,
  value: (T & { path?: string })[],
  installer: (
    path: Path,
    source: T & { path: string }
  ) => Promise<Failable<void>>,
  loader: (path: Path) => Promise<Failable<T | undefined>>
) {
  const errors: ErrorMessage[] = [];

  const isNew = (v: T & { path?: string }): v is T & { path: string } =>
    v.path !== undefined;

  // 新しいファイルをコピー
  const install = await asyncMap(value.filter(isNew), (x) =>
    installer(dirPath.child(x.name), x)
  );
  errors.push(...install.filter(isError));

  // 現状のファイル一覧を取得
  const loaded = await asyncMap(await dirPath.iter(), loader);
  errors.push(...loaded.filter(isError));

  // 削除すべきファイル一覧
  const deletFiles = loaded
    .filter((x): x is T => x !== undefined && isValid(x))
    .filter((file) => value.find((x) => x.name === file.name) === undefined);

  // 非同期で削除
  await asyncForEach(deletFiles, (x) => dirPath.child(x.name).remove(true));

  return withError(undefined, errors);
}
