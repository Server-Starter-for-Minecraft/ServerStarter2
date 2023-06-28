import { Failable } from 'app/src-electron/util/error/failable';
import { WithError, withError } from 'app/src-electron/util/error/witherror';
import { asyncForEach, asyncMap } from 'app/src-electron/util/objmap';
import { Path } from 'app/src-electron/util/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { ErrorMessage } from 'app/src-electron/schema/error';
import {
  AllFileData,
  NewFileData,
  CacheFileData,
  WorldFileData,
} from 'app/src-electron/schema/filedata';
import { WorldID } from 'app/src-electron/schema/world';
import { zip } from 'app/src-electron/util/zip';
import { WorldHandler } from '../../handler';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { cachePath } from 'app/src-electron/core/const';
import { api } from 'app/src-electron/core/api';

export const ADDITIONALS_CACHE_PATH = cachePath.child('additionals');

export class ServerAdditionalFiles<T extends Record<string, any>> {
  constructor(
    type: 'datapack' | 'plugin' | 'mod',
    cachePath: Path,
    childPath: string,
    loader: (path: Path) => Promise<Failable<T | undefined>>,
    installer: (sourcePath: Path, targetPath: Path) => Promise<Failable<void>>
  ) {
    this.type = type;
    this.cachePath = cachePath;
    this.childPath = childPath;
    this.loader = loader;
    this.installer = installer;
  }

  private loader: (path: Path) => Promise<Failable<T | undefined>>;
  private installer: (
    sourcePath: Path,
    targetPath: Path
  ) => Promise<Failable<void>>;
  private type: 'datapack' | 'plugin' | 'mod';
  private childPath: string;
  cachePath: Path;

  private getSourcePath(source: AllFileData<T>): Failable<Path> {
    let sourcePath: Path;
    switch (source.type) {
      case 'new':
        sourcePath = new Path(source.path);
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

  /** キャッシュにインストールする */
  private installCache(
    sourcePath: Path,
    source: NewFileData<T>
  ): Failable<undefined> {
    const basename = source.name + source.ext;
    const targetPath = this.cachePath.child(basename);
    if (targetPath.exists())
      return errorMessage.data.path.alreadyExists({
        type: source.isFile ? 'file' : 'directory',
        path: targetPath.path,
      });
    // 待機せずにキャッシュにインストール
    this.installer(sourcePath, targetPath).then((x) => {
      // 失敗した場合エラーをAPIで送信
      if (isError(x))
        api.send.Error(
          errorMessage.core.failCacheAddiltionalData(
            {
              type: this.type,
              path: sourcePath.path,
            },
            'info'
          )
        );
    });
  }

  async loadCache(): Promise<WithError<CacheFileData<T>[]>> {
    const dirPath = this.cachePath.child(this.childPath);
    const paths = await dirPath.iter();
    const loaded = await asyncMap(paths, async (x) => this.loader(x));

    const array = zip(paths, loaded)
      .filter((x): x is [Path, T] => x[1] !== undefined && isValid(x[1]))
      .map<CacheFileData<T>>(([p, v]) => ({
        ...v,
        type: 'system',
        isFile: !p.isDirectory(),
        name: p.stemname(),
        ext: p.extname(),
      }));

    return withError(array, loaded.filter(isError));
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
        isFile: !p.isDirectory(),
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
    await asyncForEach(value.filter(isNew), async (source) => {
      const srcPath = this.getSourcePath(source);

      if (isError(srcPath)) {
        errors.push(srcPath);
        return;
      }

      // ソースが存在しない場合
      if (!srcPath.exists()) {
        errors.push(
          errorMessage.data.path.notFound({
            type: source.isFile ? 'file' : 'directory',
            path: srcPath.path,
          })
        );
        return;
      }

      // 同一のパスだった場合無視
      const tgtPath = dirPath.child(source.name);
      if (tgtPath.path === srcPath.path) return;

      // ソースが有効なデータかどうかを確認
      const loaded = await this.load(srcPath, '' as WorldID);
      if (isError(loaded.value)) return;

      // インストール処理
      const result = await this.installer(srcPath, tgtPath);

      if (source.type === 'new') {
        this.installCache(srcPath, source);
      }

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
