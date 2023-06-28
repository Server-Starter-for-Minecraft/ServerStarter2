import { Failable } from 'app/src-electron/util/error/failable';
import { WithError, withError } from 'app/src-electron/util/error/witherror';
import { asyncForEach, asyncMap } from 'app/src-electron/util/objmap';
import { Path } from 'app/src-electron/util/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { ErrorMessage } from 'app/src-electron/schema/error';
import { AllFileData, WorldFileData } from 'app/src-electron/schema/filedata';
import { WorldID } from 'app/src-electron/schema/world';
import { zip } from 'app/src-electron/util/zip';
import { WorldHandler } from '../../handler';
import { errorMessage } from 'app/src-electron/util/error/construct';

export class ServerAdditionalFiles<T extends Record<string, any>> {
  constructor(
    cachePath: Path,
    childPath: string,
    type: 'file' | 'directory',
    loader: (path: Path) => Promise<Failable<T | undefined>>,
    installer: (sourcePath: Path, targetPath: Path) => Promise<Failable<void>>
  ) {
    this.cachePath = cachePath;
    this.childPath = childPath;
    this.type = type;
    this.loader = loader;
    this.installer = installer;
  }

  private loader: (path: Path) => Promise<Failable<T | undefined>>;
  private installer: (
    sourcePath: Path,
    targetPath: Path
  ) => Promise<Failable<void>>;
  private type: 'file' | 'directory';
  private childPath: string;
  cachePath: Path;

  private getSourcePath(source: AllFileData<T>): Failable<Path> {
    let sourcePath: Path;
    switch (source.type) {
      case 'new':
        sourcePath = new Path(source.path);
        // この時だけデータをキャッシュする
        break;
      case 'world':
        const handler = WorldHandler.get(source.id);
        if (isError(handler)) return handler;
        sourcePath = handler
          .getSavePath()
          .child(this.childPath)
          .child(source.name + source.ext);
        break;
      case 'system':
        sourcePath = this.cachePath.child(source.name + source.ext);
        break;
    }
    return sourcePath;
  }

  async load(
    cwdPath: Path,
    id: WorldID
  ): Promise<WithError<WorldFileData<T>[]>> {
    const dirPath = cwdPath.child(this.childPath);
    const paths = await dirPath.iter();
    const loaded = await asyncMap(paths, async (x) => this.loader(x));

    const array = zip(paths, loaded)
      .filter((x): x is [Path, T] => x[1] !== undefined && isValid(x[1]))
      .map<WorldFileData<T>>(([p, v]) => ({
        ...v,
        type: 'world',
        id: id,
        name: p.stemname(),
        ext: p.extname(),
      }));

    return withError(array, loaded.filter(isError));
  }

  async save(cwdPath: Path, value: AllFileData<T>[]): Promise<WithError<void>> {
    const dirPath = cwdPath.child(this.childPath);
    const errors: ErrorMessage[] = [];

    const isNew = (v: T & { path?: string }): v is T & { path: string } =>
      v.path !== undefined;

    // 新しいファイルをコピー
    await asyncForEach(value.filter(isNew), async (x) => {
      const srcPath = this.getSourcePath(x);

      if (isError(srcPath)) {
        errors.push(srcPath);
        return;
      }

      if (!srcPath.exists()) {
        errors.push(
          errorMessage.data.path.notFound({
            type: this.type,
            path: srcPath.path,
          })
        );
        return;
      }

      const tgtPath = dirPath.child(x.name);
      if (tgtPath.path === srcPath.path) return;

      const loaded = await this.load(srcPath, '' as WorldID);
      if (isError(loaded.value)) return;

      const result = await this.installer(srcPath, tgtPath);
      if (isError(result)) errors.push(result);
    });

    // 現状のファイル一覧を取得
    const loaded = await asyncMap(await dirPath.iter(), (x) => this.loader(x));
    errors.push(...loaded.filter(isError));

    // 削除すべきファイル一覧
    const deletFiles = loaded
      .filter((x): x is WorldFileData<T> => x !== undefined && isValid(x))
      .filter((file) => value.find((x) => x.name === file.name) === undefined);

    // 非同期で削除
    await asyncForEach(deletFiles, (x) => dirPath.child(x.name).remove(true));

    return withError(undefined, errors);
  }
}
