import { runDetached } from 'app/src-public/scripts/promise/runDetached';
import { api } from 'app/src-electron/core/api';
import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import {
  AllFileData,
  CacheFileData,
  fileDataKey,
  NewFileData,
  WorldFileData,
} from 'app/src-electron/schema/filedata';
import { WorldID } from 'app/src-electron/schema/world';
import { zip } from 'app/src-electron/util/binary/archive/zip';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { safeExecAsync } from 'app/src-electron/util/error/failable';
import { withError } from 'app/src-electron/util/error/witherror';
import { asyncForEach, asyncMap } from 'app/src-electron/util/obj/objmap';
import { genUUIDOf } from 'app/src-electron/util/random/uuid';

export class ServerAdditionalFiles<T extends Record<string, unknown>> {
  constructor(
    type: 'datapack' | 'plugin' | 'mod',
    cachePath: Path,
    childPath: string,
    loader: ((path: Path, force: false) => Promise<Failable<T | undefined>>) &
      ((path: Path, force: true) => Promise<Failable<T>>),
    installer: (sourcePath: Path, targetPath: Path) => Promise<Failable<void>>
  ) {
    this.type = type;
    this.cachePath = cachePath;
    this.childPath = childPath;
    this.loader = loader;
    this.installer = installer;
  }

  private loader: ((
    path: Path,
    force: false
  ) => Promise<Failable<T | undefined>>) &
    ((path: Path, force: true) => Promise<Failable<T>>);
  private installer: (
    sourcePath: Path,
    targetPath: Path
  ) => Promise<Failable<void>>;
  private type: 'datapack' | 'plugin' | 'mod';
  private childPath: string;
  cachePath: Path;

  private async getSourcePath(source: AllFileData<T>): Promise<Failable<Path>> {
    let sourcePath: Path;
    switch (source.type) {
      case 'new':
        sourcePath = new Path(source.path);
        break;
      case 'world':
        const { WorldHandler } = await import('../world/handler');
        const handler = WorldHandler.get(source.id);
        if (isError(handler)) return handler;
        sourcePath = handler
          .getSavePath()
          .child(this.childPath)
          .child(fileDataKey(source));
        break;
      case 'system':
        sourcePath = this.cachePath.child(fileDataKey(source));
        break;
    }
    return sourcePath;
  }

  /** キャッシュにインストールする */
  private async installCache(
    sourcePath: Path,
    source: NewFileData<T>
  ): Promise<Failable<undefined>> {
    const basename = fileDataKey(source);
    const targetPath = this.cachePath.child(basename);
    if (await targetPath.exists())
      return errorMessage.data.path.alreadyExists({
        type: source.isFile ? 'file' : 'directory',
        path: targetPath.path,
      });
    // 待機せずにキャッシュにインストールし，失敗した場合はエラーをAPIで送信
    runDetached(this.installer(sourcePath, targetPath), () =>
      api.send.Error(
        errorMessage.core.failCacheAddiltionalData(
          {
            type: this.type,
            path: sourcePath.path,
          },
          'info'
        )
      )
    );
  }

  /** パスからNewFileData<T>を得る */
  async loadNew(path: Path): Promise<Failable<NewFileData<T>>> {
    const loaded = await this.loader(path, true);
    if (isError(loaded)) return loaded;

    const isPathDir = await path.isDirectory();
    if (isError(isPathDir)) return isPathDir;

    const result: NewFileData<T> = {
      ...loaded,
      type: 'new',
      name: path.stemname(),
      ext: path.extname(),
      path: path.path,
      isFile: !isPathDir,
    };
    return result;
  }

  /** キャッシュにファイルを追加 */
  async appendCache(source: NewFileData<T>): Promise<Failable<void>> {
    const basename = fileDataKey(source);
    const sourcePath = new Path(source.path);
    const targetPath = this.cachePath.child(basename);
    if (await targetPath.exists())
      return errorMessage.data.path.alreadyExists({
        type: source.isFile ? 'file' : 'directory',
        path: targetPath.path,
      });
    return this.installer(sourcePath, targetPath);
  }

  /**
   * 各パスがファイル（zipやjarなど）か、フォルダかを判定する
   *
   * @param paths 追加コンテンツのパスの一覧
   * @returns 各パスがファイルの場合はtrue（判定に失敗した場合はファイルとみなす）
   */
  private async isFiles(paths: Path[]): Promise<boolean[]> {
    return asyncMap(paths, async (p) => {
      const isDir = await p.isDirectory();
      return isError(isDir) || !isDir;
    });
  }

  async loadCache(): Promise<WithError<CacheFileData<T>[]>> {
    const paths = await this.cachePath.iter();
    if (isError(paths)) return withError([], [paths]);

    const loaded = await asyncMap(paths, async (x) => this.loader(x, false));
    const isFiles = await this.isFiles(paths);

    const array = zip(zip(paths, isFiles), loaded)
      .filter(
        (x): x is [[Path, boolean], T] => x[1] !== undefined && isValid(x[1])
      )
      .map<CacheFileData<T>>(([[p, isFile], v]) => ({
        ...v,
        type: 'system',
        isFile,
        name: p.stemname(),
        ext: p.extname(),
      }));

    return withError(array, loaded.filter(isError));
  }

  /**
   * ワールドに導入済みの追加コンテンツの一覧を読み込む
   *
   * フォルダを開く操作に備えて，コンテンツのフォルダが無い場合は作成する
   *
   * @param cwdPath ワールド（サーバー）のフォルダ
   * @param id 読み込んだコンテンツに付けるワールドの ID
   * @returns 読み込めたコンテンツの一覧と，読み込めなかったコンテンツのエラー
   */
  async load(
    cwdPath: Path,
    id: WorldID
  ): Promise<WithError<WorldFileData<T>[]>> {
    const dirPath = cwdPath.child(this.childPath);
    if (!(await dirPath.exists())) {
      // Path.mkdir は失敗時に例外を投げるため，Result 型へ変換する（os/shell.ts の openFolder と同じ扱い）
      const made = await safeExecAsync(async () => dirPath.mkdir());
      if (isError(made))
        return withError(
          [],
          [
            errorMessage.data.path.creationFailed({
              type: 'directory',
              path: dirPath.path,
            }),
          ]
        );
    }
    const paths = await dirPath.iter();
    if (isError(paths)) return withError([], [paths]);

    const loaded = await asyncMap(paths, async (x) => this.loader(x, false));
    const isFiles = await this.isFiles(paths);

    const array = zip(zip(paths, isFiles), loaded)
      .filter(
        (x): x is [[Path, boolean], T] => x[1] !== undefined && isValid(x[1])
      )
      .map<WorldFileData<T>>(([[p, isFile], v]) => ({
        ...v,
        type: 'world',
        id: id,
        isFile,
        name: p.stemname(),
        ext: p.extname(),
      }));

    return withError(array, loaded.filter(isError));
  }

  async save(cwdPath: Path, value: AllFileData<T>[]): Promise<WithError<void>> {
    const dirPath = cwdPath.child(this.childPath);
    const errors: ErrorMessage[] = [];

    // 新しいファイルをコピー
    await asyncForEach(value, async (source) => {
      const srcPath = await this.getSourcePath(source);

      if (isError(srcPath)) {
        errors.push(srcPath);
        return;
      }

      // ソースが存在しない場合
      if (!(await srcPath.exists())) {
        errors.push(
          errorMessage.data.path.notFound({
            type: source.isFile ? 'file' : 'directory',
            path: srcPath.path,
          })
        );
        return;
      }

      // 同一のパスだった場合無視
      const tgtPath = dirPath.child(fileDataKey(source));
      if (tgtPath.path === srcPath.path) return;

      // ソースが有効なデータかどうかを確認
      // （ソースはワールドのフォルダではなくコンテンツそのもののため，load ではなく loader で1件を読み込む）
      const loaded = await this.loader(srcPath, true);
      if (isError(loaded)) {
        errors.push(loaded);
        return;
      }

      // インストール処理
      const result = await this.installer(srcPath, tgtPath);

      // 新規ファイルだった場合キャッシュにコピー
      if (source.type === 'new') {
        const cached = await this.installCache(srcPath, source);
        if (isError(cached)) errors.push(cached);
      }

      if (isError(result)) errors.push(result);
    });

    // 現状のファイル一覧を取得（ファイル名のみを使うため，ワールドの ID は仮のものを渡す）
    const loaded = await this.load(cwdPath, genUUIDOf(WorldID));
    errors.push(...loaded.errors);

    // 削除すべきファイル一覧
    const keepKeys = new Set(value.map(fileDataKey));
    const deletFiles = loaded.value
      .filter((x): x is WorldFileData<T> => x !== undefined && isValid(x))
      .filter((file) => !keepKeys.has(fileDataKey(file)));

    // 非同期で削除
    const deleteErrs = await asyncMap(deletFiles, async (x) =>
      dirPath.child(fileDataKey(x)).remove()
    );
    errors.push(...deleteErrs.filter(isError));

    return withError(undefined, errors);
  }
}
