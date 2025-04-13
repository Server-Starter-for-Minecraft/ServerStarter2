//
// TODO: ファイル削除や書き込み等で`Error: EBUSY: resource busy or locked`のようなファイル操作エラーが発生することがある（エラー発生時はフロントエンドが無限停止する）
// エラーが起きたときにはFailableを返すようにtry-catchでラップする
//
import * as fs from 'fs-extra';
import * as path from 'path';
import { errorMessage } from '../error/construct';
import { isError } from '../error/error';
import { Failable } from '../error/failable';
import { InfinitMap } from '../helper/infinitMap';
import { asyncForEach } from '../obj/objmap';
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

  /** @deprecated TODO: .pathへ修正*/
  str() {
    return this._path;
  }

  /** @deprecated TODO: .quotedPathへ修正 */
  strQuoted() {
    return `"${this._path.replace('\\', '\\\\').replace('"', '\\"')}"`;
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

  exists() {
    return fs.existsSync(this._path);
  }

  stat = exclusive(this._stat);
  private async _stat() {
    return await fs.stat(this.absolute().path);
  }

  isDirectory = exclusive(this._isDirectory);
  private async _isDirectory() {
    return (await this._stat()).isDirectory();
  }

  /** ファイルの最終更新時刻を取得 */
  lastUpdateTime = exclusive(this._lastUpdateTime);
  // TODO: DayJSの実装に置換
  private async _lastUpdateTime(): Promise<Date> {
    return (await fs.stat(this.path)).mtime;
  }
  // private async _lastUpdateTime(): Promise<Dayjs> {
  //   return dayjs((await fs.stat(this.path)).mtimeMs);
  // }

  rename = exclusive(this._rename);
  private async _rename(newpath: Path) {
    await newpath.parent().mkdir(true);
    await fs.rename(this._path, newpath.absolute().path);
  }

  mkdir = exclusive(this._mkdir);
  private async _mkdir(recursive = true) {
    if (!this.exists()) await fs.mkdir(this._path, { recursive });
  }

  /** ディレクトリが無かったら作成する */
  ensureDir = exclusive(this._ensureDir);
  private async _ensureDir(options?: { mode?: number }) {
    await fs.ensureDir(this._path, options);
  }

  /** ディレクトリが空の状態を保証する */
  emptyDir = exclusive(this._emptyDir);
  private async _emptyDir() {
    await fs.emptyDir(this._path);
  }

  /** @deprecated 同期ディレクトリ生成(非推奨) */
  mkdirSync(recursive = false) {
    if (!this.exists()) fs.mkdirSync(this._path, { recursive });
  }

  mklink = exclusive(this._mklink);
  private async _mklink(target: Path): Promise<Failable<void>> {
    await this.parent().mkdir();
    return await new Promise<Failable<void>>((resolve) =>
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
  private async _write(content: BytesData) {
    // TODO: エラーの戻り値を考慮して呼び出し元を修正
    await this.parent().mkdir(true);
    return await content.write(this._path);
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
    // TODO: エラーの戻り値を考慮して呼び出し元を修正
    const bytes = await (await loadBytesData()).fromText(content);
    if (isError(bytes)) return bytes;
    return await this._write(bytes);
  }

  /** @deprecated 同期書き込み(非推奨) */
  writeTextSync(content: string) {
    this.parent().mkdirSync(true);
    fs.writeFileSync(this._path, content);
  }

  writeJson = exclusive(this._writeJson);
  private async _writeJson<T>(content: T) {
    return this._writeText(JSON.stringify(content));
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
    try {
      await fs.appendFile(this._path, content, { encoding });
    } catch {
      // TODO: エラーの戻り値を考慮して呼び出し元を修正
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
  private async _readJson<T>(): Promise<Failable<T>> {
    const data = await this._read();
    if (isError(data)) return data;
    return data.json();
  }

  readText = exclusive(this._readText);
  private async _readText(): Promise<Failable<string>> {
    const data = await this._read();
    if (isError(data)) return data;
    return data.text();
  }

  /** @deprecated 非推奨 */
  readBufferSync(): Buffer {
    return fs.readFileSync(this.path);
  }

  iter = exclusive(this._iter);
  private async _iter() {
    if (this.exists() && (await this.isDirectory()))
      return (await fs.readdir(this._path)).map((p) => this.child(p));
    return [];
  }

  /**
   * ファイル / ディレクトリ を再帰的に削除
   */
  remove = exclusive(this._remove);
  private async _remove(): Promise<Failable<void>> {
    try {
      await fs.rm(this._path, { recursive: true, force: true });
    } catch {
      // TODO: エラーの戻り値を考慮して呼び出し元を修正
      return errorMessage.data.path.deletionFailed({
        type: (await this.isDirectory()) ? 'directory' : 'file',
        path: this.path,
      });
    }
  }

  copyTo = exclusive(this._copyTo);
  private async _copyTo(target: Path) {
    if (!this.exists()) return;
    await target.parent().mkdir(true);
    await target.remove();
    await fs.copy(this.path, target.path);
  }

  moveTo = exclusive(this._moveTo);
  private async _moveTo(target: Path): Promise<Failable<void>> {
    if (!this.exists()) return;
    await target.parent().mkdir(true);
    const isSuccessRemove = await target.remove();
    if (isError(isSuccessRemove)) return isSuccessRemove;

    // fs.moveだとうまくいかないことがあったので再帰的にファイルを移動
    async function recursiveMove(path: Path, target: Path) {
      if (await path.isDirectory()) {
        await target.mkdir(true);
        await asyncForEach(await path.iter(), async (child) => {
          await recursiveMove(child, target.child(child.basename()));
        });
      } else {
        await fs.move(path.path, target.path);
      }
      const isSuccessRecRemove = await path.remove();
      if (isError(isSuccessRecRemove)) return isSuccessRecRemove;
    }
    return await recursiveMove(this, target);
  }

  async changePermission(premission: number) {
    await changePermissionsRecursively(this._path, premission);
  }

  test = exclusive(async function (message: string) {
    await sleep(300);
    return 10;
  });
}

/** 再帰的にファイルの権限を書き換える */
async function changePermissionsRecursively(basePath: string, mode: number) {
  if (fs.existsSync(basePath)) {
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

const spoolers = InfinitMap.primitiveKeyWeakValue(
  (key: string) => new PromiseSpooler()
);
function exclusive<P extends any[], R>(
  target: (this: Path, ...args: P) => Promise<R>
) {
  return function (this: Path, ...args: P) {
    const key = this.absolute().path;
    return spoolers.get(key).spool(() => target.bind(this)(...args));
  };
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
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

    expect(new Path('./').child('foo/bar').path).toBe(new Path('foo/bar').path);
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
    expect(new Path('foo/').child('/bar/').path).toBe(new Path('foo/bar').path);

    expect(new Path('foo/bar').parent().path).toBe(new Path('foo').path);
    expect(new Path('foo/bar').parent(2).path).toBe(new Path('').path);
  });

  test('file', async () => {
    // ファイル操作のテスト
    const testdir = new Path('./userData/test');

    // testdirの中身をリセット (正直これができてる時点で見たいな話はある)
    await testdir.remove();
    await testdir.mkdir();

    // ディレクトリの生成/削除
    const a = testdir.child('a');
    expect(a.exists()).toBe(false);
    await a.mkdir();
    // 存在するディレクトリを生成しても何も起こらない
    await a.mkdir();
    expect(a.exists()).toBe(true);
    await a.remove();
    // 存在しないディレクトリを削除しても何も起こらない
    await a.remove();
    expect(a.exists()).toBe(false);

    // ファイルの生成/削除
    await a.mkdir();
    const b = a.child('b');
    await b.writeText('hello');
    expect(await b.readText()).toBe('hello');
    await b.remove();
    expect(b.exists()).toBe(false);
    await a.remove();

    // ディレクトリの再帰的な作成/削除
    expect(a.exists()).toBe(false);
    await b.mkdir();
    expect(b.exists()).toBe(true);
    await a.remove();
    expect(a.exists()).toBe(false);
  });

  // TODO: テストを貼り付けただけのため，今回の実装に合うよう換装する -> stream関連は基本的に不要？
  // test('stream', async () => {
  //   // ストリームのテスト
  //   const testdir = new Path('./userData/test');

  //   // testdirの中身をリセット
  //   await testdir.remove();
  //   await testdir.mkdir();

  //   const src = testdir.child('src.txt');
  //   const tgt = testdir.child('tgt.txt');
  //   const mis = testdir.child('mis.txt');

  //   // ファイルの中身をコピー
  //   await src.writeText('hello world');
  //   expect(await src.readText()).toBe('hello world');

  //   expect(tgt.exists()).toBe(false);

  //   await src.into(tgt);

  //   expect(await tgt.readText()).toBe('hello world');
  //   await tgt.remove();

  //   const { Bytes } = await import('./bytes');

  //   // ファイルの中身をバイト列に変換
  //   const bytes = await src.into(Bytes);

  //   expect(bytes.data.toString('utf8')).toBe('hello world');

  //   expect(tgt.exists()).toBe(false);

  //   // バイト列をファイルに書き込み
  //   await bytes.into(tgt);

  //   expect(await tgt.readText()).toBe('hello world');

  //   await tgt.remove();

  //   expect((await mis.into(Bytes)).error().message).toContain('ENOENT');

  //   // TODO: 失敗するストリームの調査
  //   // TODO: すでにあるファイルにストリームを書き込めないことを検証
  //   // TODO: ストリームの書き込みに失敗した場合にファイルが削除されることを確認

  //   // 後片付け
  //   await testdir.remove();

  //   // await bytes.into(tgt);

  //   // await bytes.convert(fromSHIFTJIS).into(tgt);
  //   // await bytes.convert(toSHIFTJIS).into(tgt);

  //   // await bytes.convert(fromBase64).into(tgt);
  //   // await bytes.convert(toBase64).into(tgt);

  //   // await bytes.convert(fromGZ).into(tgt);
  //   // await bytes.convert(toGZ).into(tgt);

  //   // await bytes.into(SHA256);
  //   // await bytes.into(SHA128);
  // });

  test('exclusive', async () => {
    const p1 = new Path('test1');
    const p2 = new Path('test2');
    await Promise.all([
      p1.test('01'),
      p1.test('02'),
      p1.parent().child('test1').test('03'),
    ]);
    sleep(1000);
    await Promise.all([p1.test('11'), p2.test('12')]);
  });

  describe.skip('Path file operations with busy resources', () => {
    test('write to opened file should handle EBUSY error', async () => {
      const testPath = new Path('test.txt');

      // ファイルを開いたままにする
      const fileHandle = fs.openSync(testPath.path, 'w');

      // 開いているファイルに書き込みを試みる
      const writeResult = await testPath.writeText('test content');

      // クリーンアップ
      fs.closeSync(fileHandle);
      await testPath.remove();

      // エラーがFailableとして適切に返されることを確認
      // TODO: EBUSY errorをうまく再現できていないため，要検証
      expect(isError(writeResult)).toBe(true);
    });

    test('remove opened file should handle EBUSY error', async () => {
      const testPath = new Path('test2.txt');
      await testPath.writeText('initial content');

      // ファイルを開いたままにする
      const fileHandle = fs.openSync(testPath.path, 'r');

      // 開いているファイルの削除を試みる
      const removeResult = await testPath.remove();

      // クリーンアップ
      fs.closeSync(fileHandle);
      await testPath.remove();

      // エラーがFailableとして適切に返されることを確認
      expect(isError(removeResult)).toBe(true);
    });
  });
}
