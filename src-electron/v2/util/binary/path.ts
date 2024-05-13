import * as fs from 'fs-extra';
import * as path from 'path';
import { DuplexStreamer, Readable } from './stream';
import { asyncForEach } from 'app/src-electron/util/objmap';
import * as stream from 'stream';
import { Err, Result, err, ok } from '../base';

function replaceSep(pathstr: string) {
  return pathstr.replace(/[\\\/]+/, path.sep).replace(/[\\\/]+$/, '');
}

export class Path extends DuplexStreamer<void> {
  path: string;
  constructor(value?: string) {
    super();
    if (value === undefined) {
      this.path = '';
    } else {
      this.path = path.normalize(replaceSep(value));
    }
  }

  createReadStream(): Readable {
    return new Readable(fs.createReadStream(this.str()));
  }

  write(readable: stream.Readable): Promise<Result<void, Error>> {
    let e: Err<Error> | undefined = undefined;
    const stream = fs.createWriteStream(this.str());

    readable.on('error', stream.destroy);
    readable.pipe(stream).on('error', (error) => (e = err(error)));

    return new Promise<Result<void, Error>>((resolve) => {
      readable.on('close', () => {
        if (e !== undefined) return resolve(e);
        resolve(ok(undefined));
      });
    });
  }

  child(child: string) {
    if (this.path !== '') {
      return new Path(path.join(this.path, child));
    }
    return new Path(child);
  }

  parent(times = 1) {
    if (this.path) {
      return new Path(path.join(this.path, ...new Array(times).fill('..')));
    }
    return new Path(path.join(...Array(times).fill('..')));
  }

  absolute() {
    return new Path(path.resolve(this.path));
  }

  /** このpathを起点にしたtargetの相対パスを返す */
  relativeto(target: Path) {
    return new Path(path.relative(this.path, target.path));
  }

  str() {
    return this.path;
  }

  /** "で囲まれたパス文字列を返す */
  strQuoted() {
    return '"' + this.path.replace('\\', '\\\\').replace('"', '\\"') + '"';
  }

  /** ディレクトリ階層を除いたファイル名を返す ".../../file.txt" -> "file.txt" */
  basename() {
    return path.basename(this.path);
  }

  /** ディレクトリ階層を除いたファイル名(拡張子なし)を返す ".../../file.txt" -> "file" */
  stemname() {
    return path.basename(this.path, this.extname());
  }

  /** 拡張子を返す ".../../file.txt" -> ".txt" */
  extname() {
    return path.extname(this.path);
  }

  exists() {
    return fs.existsSync(this.path);
  }

  async isDirectory() {
    return (await fs.stat(this.absolute().str())).isDirectory();
  }

  /** ファイルの最終更新時刻を取得 */
  async lastUpdateTime(): Promise<Date> {
    return (await fs.stat(this.str())).mtime;
  }

  async rename(newpath: Path) {
    await newpath.parent().mkdir();
    await fs.rename(this.path, newpath.absolute().str());
  }

  async mkdir() {
    if (!this.exists()) await fs.mkdir(this.path, { recursive: true });
  }

  /** 同期ディレクトリ生成(非推奨) */
  mkdirSync() {
    if (!this.exists()) fs.mkdirSync(this.path, { recursive: true });
  }

  async mklink(target: Path) {
    await new Promise((resolve) => fs.link(target.path, this.path, resolve));
  }

  /**
   * ファイルにテキストを書き込む
   * @param content 書き込む内容
   * @param encoding エンコード形式 デフォルト:utf-8
   */
  async writeText(content: string, encoding: BufferEncoding = 'utf8') {
    await this.parent().mkdir();
    await fs.writeFile(this.path, content, { encoding });
  }

  /**
   * ファイルからテキストを読み込む
   * @param encoding エンコード形式 デフォルト:utf-8
   */
  async readText(
    encoding: BufferEncoding = 'utf8'
  ): Promise<Result<string, Error>> {
    try {
      return ok(await fs.readFile(this.path, { encoding }));
    } catch (e) {
      return err(e as Error);
    }
  }

  /**
   * ファイルの末尾にテキストを追加
   * @param encoding エンコード形式 デフォルト:utf-8
   */
  async appendText(content: string, encoding: BufferEncoding = 'utf8') {
    await this.parent().mkdir();
    await fs.appendFile(this.path, content, { encoding });
  }

  async iter() {
    if (this.exists() && (await this.isDirectory()))
      return (await fs.readdir(this.path)).map((p) => this.child(p));
    return [];
  }

  /**
   * ファイル / ディレクトリ を再帰的に削除
   */
  async remove(): Promise<void> {
    if (!this.exists()) return;
    if (await this.isDirectory()) {
      await fs.rm(this.path, { recursive: true });
    } else {
      await fs.unlink(this.path);
    }
  }

  async copyTo(target: Path) {
    if (!this.exists()) return;
    await target.parent().mkdir();
    await target.remove();
    await fs.copy(this.str(), target.str());
  }

  async moveTo(target: Path) {
    if (!this.exists()) return;
    await target.parent().mkdir();
    await target.remove();

    // fs.moveだとうまくいかないことがあったので再帰的にファイルを移動
    async function recursiveMove(path: Path, target: Path) {
      if (await path.isDirectory()) {
        await target.mkdir();
        await asyncForEach(await path.iter(), async (child) => {
          await recursiveMove(child, target.child(child.basename()));
        });
      } else {
        await fs.move(path.str(), target.str());
      }
      await path.remove();
    }
    await recursiveMove(this, target);
  }

  async changePermission(premission: number) {
    await changePermissionsRecursively(this.path, premission);
  }
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

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('path', () => {
    // パス操作のテスト
    expect(new Path('.').str()).toBe('.');
    expect(new Path('./').str()).toBe('.');
    expect(new Path('').str()).toBe('.');

    expect(new Path('..').str()).toBe('..');
    expect(new Path('../').str()).toBe('..');

    expect(new Path('./').child('foo').str()).toBe('foo');
    expect(new Path('./').child('foo/').str()).toBe('foo');
    expect(new Path('./').child('/foo/').str()).toBe('foo');

    expect(new Path('./').child('foo').str()).toBe('foo');
    expect(new Path('./').child('/foo/').str()).toBe('foo');

    expect(new Path('foo').str()).toBe('foo');
    expect(new Path('foo/').str()).toBe('foo');

    expect(new Path('foo').child('bar').str()).toBe(new Path('foo/bar').str());
    expect(new Path('foo/').child('/bar/').str()).toBe(
      new Path('foo/bar').str()
    );

    expect(new Path('foo/bar').parent().str()).toBe(new Path('foo').str());
    expect(new Path('foo/bar').parent(2).str()).toBe(new Path('').str());
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
    expect((await b.readText()).value).toBe('hello');
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

  test('stream', async () => {
    // ストリームのテスト
    const testdir = new Path('./userData/test');

    // testdirの中身をリセット
    await testdir.remove();
    await testdir.mkdir();

    const src = testdir.child('src.txt');
    const tgt = testdir.child('tgt.txt');
    const mis = testdir.child('mis.txt');

    // ファイルの中身をコピー
    await src.writeText('hello world');
    expect((await src.readText()).value).toBe('hello world');

    await src.into(tgt);

    expect((await tgt.readText()).value).toBe('hello world');
    await tgt.remove();

    const { Bytes } = await import('./bytes');

    // ファイルの中身をバイト列に変換
    const bytes = (await src.into(Bytes)).value;

    expect(bytes.data.toString('utf8')).toBe('hello world');

    // バイト列をファイルに書き込み
    await bytes.into(tgt);

    expect((await tgt.readText()).value).toBe('hello world');

    await tgt.remove();

    expect((await mis.into(Bytes)).error.message).toContain('ENOENT');

    // 後片付け
    await testdir.remove();
  });
}
