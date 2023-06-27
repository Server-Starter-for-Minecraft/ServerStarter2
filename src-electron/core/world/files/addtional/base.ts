import { Failable, isFailure, isSuccess } from 'app/src-electron/api/failable';
import { WithError, withError } from 'app/src-electron/api/witherror';
import { FileData } from 'app/src-electron/schema/filedata';
import { asyncForEach, asyncMap } from 'app/src-electron/util/objmap';
import { Path } from 'app/src-electron/util/path';

export type ServerAdditionalFiles<T extends FileData> = {
  load(cwdPath: Path): Promise<WithError<Failable<T[]>>>;
  save(
    cwdPath: Path,
    value: (T & { path?: string })[]
  ): Promise<WithError<Failable<void>>>;
  path(cwdPath: Path): Path;
};

export async function loadAdditionalFiles<T extends FileData>(
  dirPath: Path,
  loader: (path: Path) => Promise<Failable<T>>
) {
  const loaded = await asyncMap(await dirPath.iter(), loader);

  return withError(loaded.filter(isSuccess), loaded.filter(isFailure));
}

export async function saveAdditionalFiles<T extends FileData>(
  dirPath: Path,
  value: (T & { path?: string })[],
  installer: (
    path: Path,
    source: T & { path: string }
  ) => Promise<Failable<void>>,
  loader: (path: Path) => Promise<Failable<T>>
) {
  const errors: Error[] = [];

  const isNew = (v: T & { path?: string }): v is T & { path: string } =>
    v.path !== undefined;

  // 新しいファイルをコピー
  const install = await asyncMap(value.filter(isNew), (x) =>
    installer(dirPath.child(x.name), x)
  );
  errors.push(...install.filter(isFailure));

  // 現状のファイル一覧を取得
  const loaded = await asyncMap(await dirPath.iter(), loader);
  errors.push(...loaded.filter(isFailure));

  // 削除すべきファイル一覧
  const deletFiles = loaded.filter(
    (file) => value.find((x) => x.name === file.name) === undefined
  );

  // 非同期で削除
  await asyncForEach(deletFiles, (x) => dirPath.child(x.name).remove(true));

  return withError(undefined, errors);
}
