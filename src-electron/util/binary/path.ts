import dayjs, { type Dayjs } from 'dayjs';
import fs from 'fs-extra';
import * as path from 'path';
import { z } from 'zod';
import { errorMessage } from '../error/construct';
import { fromRuntimeError, isError } from '../error/error';
import { Failable, safeExecAsync } from '../error/failable';
import { InfinitMap } from '../helper/infinitMap';
import { sleep } from '../promise/sleep';
import { PromiseSpooler } from '../promise/spool';
import type { BytesData } from './bytesData';

function replaceSep(pathstr: string) {
  return pathstr.replace(/[\\\/]+/, path.sep).replace(/[\\\/]+$/, '');
}

const _bytesData = import('./bytesData');
async function loadBytesData() {
  return (await _bytesData).BytesData;
}

export class Path {
  private _path: string;
  constructor(value?: string | Path) {
    if (value === undefined) {
      this._path = '';
    } else if (typeof value === 'string') {
      this._path = path.normalize(replaceSep(value));
    } else {
      this._path = value._path;
    }
  }

  isLocked(): boolean {
    return spoolers.get(this.absolute().path).hasSpooled();
  }

  child(...paths: string[]) {
    if (this._path !== '') {
      return new Path(path.join(this._path, ...paths));
    }
    return new Path(path.join(...paths));
  }

  parent(times = 1) {
    if (this._path) {
      return new Path(path.join(this._path, ...new Array(times).fill('..')));
    }
    return new Path(path.join(...Array(times).fill('..')));
  }

  absolute() {
    return new Path(path.resolve(this._path));
  }

  /** 絶対パスかを返す */
  isAbsolute() {
    return path.isAbsolute(this._path);
  }

  /** 環境変数 PATH などで複数のパスを区切る文字（Windows は `;`，それ以外は `:`） */
  static readonly delimiter = path.delimiter;

  /** このpathを起点にしたtargetの相対パスを返す */
  relativeto(target: Path) {
    return new Path(path.relative(this._path, target._path));
  }

  /** パスを文字列化する */
  get path() {
    return this._path;
  }

  /** "で囲まれたパス文字列を返す */
  get quotedPath() {
    return `"${this._path.replace('\\', '\\\\').replace('"', '\\"')}"`;
  }

  /** @deprecated .pathを用いること*/
  str() {
    return this.path;
  }

  /** @deprecated .quotedPathを用いること */
  strQuoted() {
    return this.quotedPath;
  }

  /** ディレクトリ階層を除いたファイル名を返す ".../../file.txt" -> "file.txt" */
  basename() {
    return path.basename(this._path);
  }

  /** ディレクトリ階層を除いたファイル名(拡張子なし)を返す ".../../file.txt" -> "file" */
  stemname() {
    return path.basename(this._path, this.extname());
  }

  /** 拡張子を返す ".../../file.txt" -> ".txt" */
  extname() {
    return path.extname(this._path);
  }

  /** ファイル・ディレクトリが存在するかを返す */
  async exists(): Promise<boolean> {
    return fs.pathExists(this._path);
  }

  stat = exclusive(this._stat);
  private async _stat(): Promise<Failable<fs.Stats>> {
    const stat = await safeExecAsync(async () => fs.stat(this.absolute().path));
    if (isError(stat)) {
      return errorMessage.data.path.loadingFailed({
        type: 'file', // 存在しないパスはファイルとして扱う
        path: this.path,
      });
    }
    return stat;
  }

  isDirectory = exclusive(this._isDirectory);
  private async _isDirectory(): Promise<Failable<boolean>> {
    const stat = await this._stat();
    if (isError(stat)) return stat;
    return stat.isDirectory();
  }

  /** ファイルの最終更新時刻を取得 */
  lastUpdateTime = exclusive(this._lastUpdateTime);
  private async _lastUpdateTime(): Promise<Dayjs> {
    return dayjs((await fs.stat(this.path)).mtimeMs);
  }

  rename = exclusive(this._rename);
  private async _rename(newpath: Path): Promise<Failable<void>> {
    await newpath.parent().mkdir(true);
    const isDir = await this._isDirectory();
    if (isError(isDir)) return isDir;

    const renamed = await safeExecAsync(async () =>
      fs.rename(this._path, newpath.absolute().path)
    );
    if (isError(renamed)) {
      return errorMessage.data.path.renameFailed({
        type: isDir ? 'directory' : 'file',
        path: this.path,
      });
    }
  }

  mkdir = exclusive(this._mkdir);
  private async _mkdir(recursive = true) {
    if (!(await this.exists())) await fs.mkdir(this._path, { recursive });
  }

  /** ディレクトリが無かったら作成する */
  ensureDir = exclusive(this._ensureDir);
  private async _ensureDir(options?: { mode?: number }) {
    await fs.ensureDir(this._path, options);
  }

  /**
   * ディレクトリが空の状態を保証する
   *
   * ディレクトリが空でなければ、ディレクトリの内容を削除する。
   * ディレクトリが存在しない場合は作成する。ディレクトリ自体は削除されない。
   */
  emptyDir = exclusive(this._emptyDir);
  private async _emptyDir() {
    await fs.emptyDir(this._path);
  }

  mklink = exclusive(this._mklink);
  private async _mklink(target: Path): Promise<Failable<void>> {
    await this.parent().mkdir();
    return new Promise<Failable<void>>((resolve) =>
      fs.link(target._path, this._path, (e) => {
        e
          ? resolve(
              errorMessage.data.path.loadingFailed({
                type: 'directory',
                path: this.path,
              })
            )
          : resolve();
      })
    );
  }

  write = exclusive(this._write);
  private async _write(content: BytesData, encoding?: BufferEncoding) {
    await this.parent().mkdir(true);
    return content.write(this._path, undefined, encoding);
  }

  /**
   * ファイルにテキストを書き込む
   * @param content 書き込む内容
   * @param encoding エンコード形式 デフォルト:utf-8
   */
  writeText = exclusive(this._writeText);
  private async _writeText(
    content: string,
    encoding: BufferEncoding = 'utf8'
  ): Promise<Failable<void>> {
    const bytes = await (await loadBytesData()).fromText(content);
    if (isError(bytes)) return bytes;
    return this._write(bytes, encoding);
  }

  writeJson = exclusive(this._writeJson);
  private async _writeJson<T>(content: T, encoding?: BufferEncoding) {
    return this._writeText(JSON.stringify(content), encoding);
  }

  /**
   * ファイルの末尾にテキストを追加
   * @param encoding エンコード形式 デフォルト:utf-8
   */
  appendText = exclusive(this._appendText);
  private async _appendText(
    content: string,
    encoding: BufferEncoding = 'utf8'
  ) {
    await this.parent().mkdir();
    const appended = await safeExecAsync(async () =>
      fs.appendFile(this._path, content, { encoding })
    );
    if (isError(appended)) {
      return errorMessage.data.path.creationFailed({
        type: 'file',
        path: this.path,
      });
    }
  }

  read = exclusive(this._read);
  private async _read(): Promise<Failable<BytesData>> {
    return (await loadBytesData()).fromPath(this);
  }

  readJson = exclusive(this._readJson);
  private async _readJson<T>(
    validator: z.ZodType<T, any>,
    encoding?: BufferEncoding
  ): Promise<Failable<T>> {
    const data = await this._read();
    if (isError(data)) return data;
    return data.json(validator, encoding);
  }

  readText = exclusive(this._readText);
  private async _readText(
    encoding?: BufferEncoding
  ): Promise<Failable<string>> {
    const data = await this._read();
    if (isError(data)) return data;
    return data.text(encoding);
  }

  async iter(): Promise<Failable<Path[]>> {
    const isDir = await this._isDirectory();
    if (isError(isDir)) return isDir;

    if ((await this.exists()) && isDir)
      return (await fs.readdir(this._path)).map((p) => this.child(p));
    return [];
  }

  /**
   * ファイル / ディレクトリ を再帰的に削除
   */
  remove = exclusive(this._remove);
  private async _remove(): Promise<Failable<void>> {
    if (!(await this.exists())) return;
    const isDir = await this._isDirectory();
    if (isError(isDir)) return isDir;

    // 他プロセスによる一時的なファイルロック(EBUSY等)の場合は再試行する
    const removed = await safeExecAsync(async () =>
      fs.rm(this._path, {
        recursive: true,
        force: true,
        maxRetries: BUSY_RETRY_COUNT,
        retryDelay: BUSY_RETRY_DELAY_MS,
      })
    );
    if (isError(removed)) {
      return errorMessage.data.path.deletionFailed({
        type: isDir ? 'directory' : 'file',
        path: this.path,
      });
    }
  }

  copyTo = exclusive(this._copyTo);
  private async _copyTo(target: Path) {
    if (!(await this.exists())) return;
    await target.parent().mkdir(true);
    const removed = await target.remove();
    if (isError(removed)) return removed;
    const copied = await retryOnBusy(async () =>
      fs.copy(this.path, target.path)
    );
    if (isError(copied)) {
      const isDir = await this._isDirectory();
      if (isError(isDir)) return isDir;
      return errorMessage.data.path.copyFailed({
        type: isDir ? 'directory' : 'file',
        path: this.path,
      });
    }
  }

  moveTo = exclusive(this._moveTo);
  private async _moveTo(
    target: Path,
    options?: fs.MoveOptions
  ): Promise<Failable<void>> {
    if (!(await this.exists())) return;
    await target.parent().mkdir(true);
    const isSuccessRemove = await target._remove();
    if (isError(isSuccessRemove)) return isSuccessRemove;

    // fs.moveだとうまくいかないことがあったので再帰的にファイルを移動
    async function recursiveMove(
      path: Path,
      target: Path
    ): Promise<Failable<void>> {
      const isDir = await path._isDirectory();
      if (isError(isDir)) return isDir;

      if (isDir) {
        await target.mkdir(true);
        const allPaths = await path.iter();
        if (isError(allPaths)) return allPaths;

        // 1つでも移動できなかった場合はエラーを返す
        for (const child of allPaths) {
          const moved = await recursiveMove(
            child,
            target.child(child.basename())
          );
          if (isError(moved)) return moved;
        }
      } else {
        const moved = await safeExecAsync(async () =>
          fs.move(path.path, target.path, options)
        );
        if (isError(moved)) {
          return errorMessage.data.path.moveFailed({
            type: 'file',
            path: path.path,
          });
        }
      }
    }
    const res = await recursiveMove(this, target);
    if (isError(res)) return res;

    // remove source
    return this._remove();
  }

  async changePermission(premission: number) {
    await changePermissionsRecursively(this._path, premission);
  }

  test = exclusive(this._test);
  private async _test(delay: number) {
    await sleep(delay);
    return delay;
  }
}

/** 再帰的にファイルの権限を書き換える */
async function changePermissionsRecursively(basePath: string, mode: number) {
  if (await fs.pathExists(basePath)) {
    await fs.chmod(basePath, mode);
    if ((await fs.lstat(basePath)).isDirectory()) {
      const files = await fs.readdir(basePath);
      for (const file of files) {
        const filePath = path.join(basePath, file);
        await changePermissionsRecursively(filePath, mode);
      }
    }
  }
}

/** ファイルロックによる一時的な失敗の場合に再試行する回数 */
const BUSY_RETRY_COUNT = 5;
/** ファイルロックによる一時的な失敗の場合に再試行するまでの待機時間(ms) */
const BUSY_RETRY_DELAY_MS = 200;

/**
 * 一時的なファイルロックとみなして再試行するエラーコード
 *
 * Windowsでは他プロセスが掴んでいるファイルの操作がEBUSYだけでなくEPERMとなる場合もあるため両方を対象とする
 * （fs.rmのmaxRetriesも同様のエラーコードを再試行対象としている）
 */
const BUSY_ERROR_CODES = new Set(['EBUSY', 'EPERM']);

/**
 * ファイルが一時的にロックされている場合に処理を再試行する
 *
 * サーバー終了直後などは、Javaプロセスやウイルス対策ソフトがファイルを掴んだままの場合があるため、
 * 少し待ってから再試行することで、ファイル操作の失敗を回避する
 *
 * 再試行するかどうかを例外のエラーコードで判定するため，safeExecAsync を使わずに例外を直接扱う
 * （lint の例外として eslint-rules/config.js に登録している）
 *
 * @param operation 再試行するファイル操作
 * @returns ファイル操作の戻り値（再試行しても失敗した場合はエラー）
 */
async function retryOnBusy<T>(
  operation: () => Promise<T>
): Promise<Failable<T>> {
  for (let retried = 0; ; retried++) {
    try {
      return await operation();
    } catch (e) {
      // Node.js のファイル操作の例外は，原因を表す文字列の code を持つ
      const code =
        e instanceof Error && 'code' in e && typeof e.code === 'string'
          ? e.code
          : undefined;
      const isBusy = code !== undefined && BUSY_ERROR_CODES.has(code);
      if (!isBusy || retried >= BUSY_RETRY_COUNT) return fromRuntimeError(e);
      await sleep(BUSY_RETRY_DELAY_MS);
    }
  }
}

/** パスに関する処理を同期的に処理するために各命令をプールする */
const spoolers = InfinitMap.primitiveKeyWeakValue(
  (_key: string) => new PromiseSpooler()
);
/**
 * 各関数の実行時に当該処理をプールする
 *
 * Pathクラスの中でプールが定義された関数を実行するときには`_Hoge()`という本体実装側を呼び出す
 * （関数A自体と関数Aの中で呼び出す処理で重複してプールすることがないようにする）
 */
function exclusive<P extends any[], R>(
  target: (this: Path, ...args: P) => Promise<R>
) {
  return async function (this: Path, ...args: P) {
    const key = this.absolute().path;
    return spoolers.get(key).spool(async () => target.bind(this)(...args));
  };
}

/** In Source Testing */
if (import.meta.vitest) {
  // アサーション関数は型注釈のある名前でしか呼べないため，型を明示して取り出す
  const assertions = await import('app/test/util/assert');
  const assertOk: typeof assertions.assertOk = assertions.assertOk;

  describe('Path', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.mkdir();

    test('path', () => {
      // パス操作のテスト
      expect(new Path('.').path).toBe('.');
      expect(new Path('./').path).toBe('.');
      expect(new Path('').path).toBe('.');

      expect(new Path('..').path).toBe('..');
      expect(new Path('../').path).toBe('..');

      expect(new Path('./').child('foo').path).toBe('foo');
      expect(new Path('./').child('foo/').path).toBe('foo');
      expect(new Path('./').child('/foo/').path).toBe('foo');

      expect(new Path('./').child('foo').path).toBe('foo');
      expect(new Path('./').child('/foo/').path).toBe('foo');

      expect(new Path('./').child('foo/bar').path).toBe(
        new Path('foo/bar').path
      );
      expect(new Path('./').child('foo\\bar').path).toBe(
        new Path('foo/bar').path
      );
      expect(new Path('./').child('foo', 'bar').path).toBe(
        new Path('foo/bar').path
      );
      expect(new Path('./').child('/foo/', '/bar/', '/buz/').path).toBe(
        new Path('foo/bar/buz').path
      );

      expect(new Path('foo').path).toBe('foo');
      expect(new Path('foo/').path).toBe('foo');

      expect(new Path('foo').child('bar').path).toBe(new Path('foo/bar').path);
      expect(new Path('foo/').child('/bar/').path).toBe(
        new Path('foo/bar').path
      );

      expect(new Path('foo/bar').parent().path).toBe(new Path('foo').path);
      expect(new Path('foo/bar').parent(2).path).toBe(new Path('').path);
    });

    test('creation', async () => {
      // ファイル操作のテスト
      const testdir = workPath.child('creations');

      // testdirの中身をリセット (正直これができてる時点でみたいな話はある)
      await testdir.remove();
      await testdir.mkdir();

      // ディレクトリの生成/削除
      const a = testdir.child('a');
      expect(await a.exists()).toBe(false);
      await a.mkdir();
      // 存在するディレクトリを生成しても何も起こらない
      await a.mkdir();
      expect(await a.exists()).toBe(true);
      await a.remove();
      // 存在しないディレクトリを削除しても何も起こらない
      await a.remove();
      expect(await a.exists()).toBe(false);

      // ファイルの生成/削除
      await a.mkdir();
      const b = a.child('b');
      await b.writeText('hello');
      expect(await b.readText()).toBe('hello');
      await b.remove();
      expect(await b.exists()).toBe(false);
      await a.remove();

      // ディレクトリの再帰的な作成/削除
      expect(await a.exists()).toBe(false);
      await b.mkdir();
      expect(await b.exists()).toBe(true);
      await a.remove();
      expect(await a.exists()).toBe(false);

      // ensureDirはディレクトリが存在しない場合のみ作成する
      await a.ensureDir();
      expect(await a.exists()).toBe(true);

      // emptyDirはディレクトリが空であることを保証する
      await a.child('sample.txt').writeText('hello');
      const aPaths1 = await a.iter();
      assertOk(aPaths1);
      expect(aPaths1.length).toBe(1);
      await a.emptyDir();

      const aPaths2 = await a.iter();
      assertOk(aPaths2);
      expect(aPaths2.length).toBe(0);
    });

    test('isDirectory', async () => {
      const testdir = workPath.child('isDirectory');
      await testdir.remove();

      // 存在しないディレクトリをチェックするとエラー
      const isDirectoryFailResult = await testdir.isDirectory();
      expect(isError(isDirectoryFailResult)).toBe(true);

      // ディレクトリを生成
      await testdir.mkdir();

      // 存在するディレクトリをチェックすると成功
      const isDirectorySuccessResult = await testdir.isDirectory();
      expect(isError(isDirectorySuccessResult)).toBe(false);
      expect(isDirectorySuccessResult).toBe(true);
    });

    test('rename', async () => {
      // ファイル操作のテスト
      const testdir = workPath.child('renames');
      await testdir.emptyDir();

      // リネーム（ファイル）
      const renameFile = testdir.child('renameFile.txt');
      // 存在しないファイルをリネームする場合はエラー
      const renameFailResult = await renameFile.rename(
        testdir.child('renameFile2.txt')
      );
      expect(isError(renameFailResult)).toBe(true);
      // 存在するファイルをリネームする場合は成功
      await renameFile.writeText('hello');
      const renameSuccessResult = await renameFile.rename(
        testdir.child('renameFile2.txt')
      );
      expect(isError(renameSuccessResult)).toBe(false);

      // リネーム後のファイルが存在することを確認
      expect(await renameFile.exists()).toBe(false);
      expect(await testdir.child('renameFile2.txt').exists()).toBe(true);

      // リネーム（ディレクトリ）
      const renameDir = testdir.child('renameDir');
      await renameDir.mkdir();
      await renameDir.rename(testdir.child('renameDir2'));
      expect(await renameDir.exists()).toBe(false);
      expect(await testdir.child('renameDir2').exists()).toBe(true);
    });

    test('file operations', async () => {
      const testdir = workPath.child('operations');
      await testdir.emptyDir();
      const sourceDir = testdir.child('source');
      await sourceDir.child('a.txt').writeText('a');
      await sourceDir.child('dir', 'b.txt').writeText('b');

      // check copy
      const copyTargetDir = testdir.child('copyTarget');
      const copyRes = await sourceDir.copyTo(copyTargetDir);
      expect(isError(copyRes)).toBe(false);
      expect(await sourceDir.exists()).toBe(true);
      expect(await copyTargetDir.child('a.txt').exists()).toBe(true);
      expect(await copyTargetDir.child('dir', 'b.txt').exists()).toBe(true);

      // check move
      const moveTargetDir = testdir.child('moveTarget');
      const moveRes = await sourceDir.moveTo(moveTargetDir);
      expect(isError(moveRes)).toBe(false);
      expect(await sourceDir.exists()).toBe(false);
      expect(await moveTargetDir.child('a.txt').exists()).toBe(true);
      expect(await moveTargetDir.child('dir', 'b.txt').exists()).toBe(true);
    });

    test('json files', async () => {
      const testdir = workPath.child('jsons');
      await testdir.emptyDir();
      const jsonFile = testdir.child('target.json');
      const sampleObj = {
        a: 1,
        b: '2',
        c: [3, 4, 5],
        d: { e: 6, f: 7 },
      };
      const ObjType = z.object({
        a: z.number(),
        b: z.string(),
        c: z.array(z.number()),
        d: z.object({ e: z.number(), f: z.number() }),
      });

      await jsonFile.writeJson(sampleObj);
      const readObj = await jsonFile.readJson(ObjType);
      expect(readObj).toEqual(sampleObj);
    });

    test('iterDir', async () => {
      const testdir = workPath.child('iterDirs');

      // ファイルの一覧表示
      const file1 = testdir.child('file1.txt');
      const file2 = testdir.child('file2.txt');
      await file1.writeText('hello');
      await file2.writeText('world');
      const allPaths = await testdir.iter();
      assertOk(allPaths);
      const fileTxts = await Promise.all(
        allPaths.map(async (file) => file.readText())
      );
      expect(fileTxts).toEqual(['hello', 'world']);
    });

    test('file path', async () => {
      const testdir = workPath.child('pathChecks');
      const file1 = testdir.child('file1.txt');

      // ファイル名
      expect(file1.basename()).toBe('file1.txt');
      expect(file1.stemname()).toBe('file1');
      expect(file1.extname()).toBe('.txt');

      // 相対パス
      expect(file1.relativeto(testdir).path).toBe('..');
    });

    test('exclusive control', async () => {
      // 検証対象のファイル
      const p1 = new Path('test1');
      // 別オブジェクトから同一のファイル（test1）にアクセスする状況を想定
      const p2 = new Path('test1');
      // 完全別ファイル
      const p3 = new Path('test2');
      const executionOrder: number[] = [];

      /** 指定時間`delay`にtest1のロック状態を確認する */
      const checkLock = async (delay: number) => {
        await sleep(delay);
        return p1.isLocked();
      };

      // Run two test() calls simultaneously
      const [result1, isLocked1, result2, isLocked2, result3] =
        await Promise.all([
          // run time is 100ms
          p1.test(100).then((val) => {
            executionOrder.push(1);
            return val;
          }),
          checkLock(50), // 50ms経過時点ではtest1が実行中のため，test1がロックされている
          // run time is 10ms
          p2.test(10).then((val) => {
            executionOrder.push(2);
            return val;
          }),
          // --> total run time is 110ms

          checkLock(200), // 200ms経過時点ではtest1が完了しているため，test1がロックされていない
          // other file
          p3.test(50).then((val) => {
            executionOrder.push(3);
            return val;
          }),
        ]);

      // Verify:
      // 1. Both calls return expected value (10)
      expect(result1).toBe(100);
      expect(result2).toBe(10);
      expect(result3).toBe(50);

      // 2. test1 is locked for 50ms, not locked for 200ms
      expect(isLocked1).toBe(true);
      expect(isLocked2).toBe(false);

      // 3. Execution order shows sequential processing (not parallel)
      // test1とtest2という別リソースに対する処理は並列に実行されるが，
      // test1同士という同じリソースに対する処理は直列に実行される
      // test1 |---------->(p1, 100ms) |->(p2, 10ms)
      // check       ^(50ms, Lock=true)                ^(200ms, Lock=false)
      // test2 |----->(p3, 50ms)
      expect(executionOrder).toEqual([3, 1, 2]);
    });
  });
}
