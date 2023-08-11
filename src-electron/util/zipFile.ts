import { CentralDirectory, Open, File } from 'unzipper';
import { Path } from './path';
import { errorMessage } from './error/construct';
import { BytesData } from './bytesData';
import { Failable, failabilify } from './error/failable';
import { isError } from 'src/scripts/error';

export class ZipFile {
  private zip: Promise<Failable<CentralDirectory>>;
  private files: Promise<Failable<File[]>>;
  path: Path;

  constructor(path: Path) {
    this.path = path;
    const zip = failabilify(Open.file)(path.path);
    this.zip = zip;
    this.files = (async () => {
      const z = await zip;
      if (isError(z)) return z;
      return z.files;
    })();
  }

  async getFile(path: string): Promise<Failable<BytesData>> {
    const files = await this.files;
    if (isError(files)) return files;
    const file = files.find((d) => d.path === path);
    if (file === undefined)
      return errorMessage.data.path.notFound({
        type: 'file',
        path: this.path.path + '(' + path + ')',
      });
    return BytesData.fromBuffer(await file.buffer());
  }

  async hasFile(path: string): Promise<Failable<boolean>> {
    const files = await this.files;
    if (isError(files)) return files;
    const file = files.find((d) => d.path === path);
    return file !== undefined;
  }

  /** 正規表現にあったパスを持つファイルの一覧を返す */
  async match(pattern: RegExp): Promise<Failable<File[]>> {
    const files = await this.files;
    if (isError(files)) return files;
    return files.filter((d) => d.path.match(pattern));
  }

  /** zipを展開 */
  async extract(path: Path) {
    const zip = await this.zip;
    if (isError(zip)) return zip;
    await zip.extract({
      path: path.path,
      concurrency: 10,
    });
  }
}
