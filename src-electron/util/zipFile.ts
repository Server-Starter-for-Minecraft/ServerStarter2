import { CentralDirectory, Open, File } from 'unzipper';
import { Path } from './path';
import { errorMessage } from './error/construct';
import { BytesData } from './bytesData';
import { Failable } from './error/failable';

export class ZipFile {
  private files: Promise<File[]>;
  private path: Path;

  constructor(path: Path) {
    this.path = path;
    this.files = (async () => (await Open.file(path.path)).files)();
  }

  async getFile(path: string): Promise<Failable<BytesData>> {
    const file = (await this.files).find((d) => d.path === path);
    if (file === undefined)
      return errorMessage.data.path.notFound({
        type: 'file',
        path: this.path.path + '(' + path + ')',
      });
    return BytesData.fromBuffer(await file.buffer());
  }

  async hasFile(path: string): Promise<boolean> {
    const file = (await this.files).find((d) => d.path === path);
    return file !== undefined;
  }

  async match(pattern: RegExp): Promise<File[]> {
    return (await this.files).filter((d) => d.path.match(pattern));
  }
}
