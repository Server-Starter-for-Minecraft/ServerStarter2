//
// TODO: ファイル削除や書き込み等で`Error: EBUSY: resource busy or locked`のようなファイル操作エラーが発生することがある（エラー発生時はフロントエンドが無限停止する）
// エラーが起きたときにはFailableを返すようにtry-catchでラップする
//
import * as fs from 'fs-extra';
import * as path from 'path';
import { isError } from '../error/error';
import { Failable } from '../error/failable';
import { asyncForEach } from '../obj/objmap';
import type { BytesData } from './bytesData';

function replaceSep(pathstr: string) {
  return pathstr.replace(/[\\\/]+/, path.sep).replace(/[\\\/]+$/, '');
}

const _bytesData = import('./bytesData');
async function loadBytesData() {
  return (await _bytesData).BytesData;
}

export class Path {
  path: string;
  constructor(value?: string) {
    if (value === undefined) {
      this.path = '';
    } else {
      this.path = path.normalize(replaceSep(value));
    }
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
    return `"${this.path.replace('\\', '\\\\').replace('"', '\\"')}"`;
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
    await newpath.parent().mkdir(true);
    await fs.rename(this.path, newpath.absolute().str());
  }

  async mkdir(recursive = false) {
    if (!this.exists()) await fs.mkdir(this.path, { recursive });
  }

  /** 同期ディレクトリ生成(非推奨) */
  mkdirSync(recursive = false) {
    if (!this.exists()) fs.mkdirSync(this.path, { recursive });
  }

  async mklink(target: Path) {
    await new Promise((resolve) => fs.link(target.path, this.path, resolve));
  }

  async write(content: BytesData) {
    await this.parent().mkdir(true);
    await content.write(this.path);
  }

  async writeText(content: string) {
    await this.parent().mkdir(true);
    await fs.writeFile(this.path, content);
  }

  async appendText(content: string) {
    await this.parent().mkdir(true);
    await fs.appendFile(this.path, content);
  }

  /** 同期書き込み(非推奨) */
  writeTextSync(content: string) {
    this.parent().mkdirSync(true);
    fs.writeFileSync(this.path, content);
  }

  async writeJson<T>(content: T) {
    await this.parent().mkdir(true);
    await fs.writeFile(this.path, JSON.stringify(content));
  }

  async read(): Promise<Failable<BytesData>> {
    return await (await loadBytesData()).fromPath(this);
  }

  async readJson<T>(): Promise<Failable<T>> {
    const data = await (await loadBytesData()).fromPath(this);
    if (isError(data)) return data;
    return await data.json();
  }

  async readText(): Promise<Failable<string>> {
    const data = await (await loadBytesData()).fromPath(this);
    if (isError(data)) return data;
    return await data.text();
  }

  /** 非推奨 */
  readBufferSync(): Buffer {
    return fs.readFileSync(this.str());
  }

  async iter() {
    if (this.exists() && (await this.isDirectory()))
      return (await fs.readdir(this.path)).map((p) => this.child(p));
    return [];
  }

  async remove() {
    if (!this.exists()) return;

    if (await this.isDirectory()) {
      await fs.rm(this.path, { recursive: true });
    } else {
      await fs.unlink(this.path);
    }
  }

  async copyTo(target: Path) {
    if (!this.exists()) return;
    await target.parent().mkdir(true);
    await target.remove();
    await fs.copy(this.str(), target.str());
  }

  async moveTo(target: Path) {
    if (!this.exists()) return;
    await target.parent().mkdir(true);
    await target.remove();

    // fs.moveだとうまくいかないことがあったので再帰的にファイルを移動
    async function recursiveMove(path: Path, target: Path) {
      if (await path.isDirectory()) {
        await target.mkdir(true);
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
