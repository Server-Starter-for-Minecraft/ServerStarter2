import { CentralDirectory, Open } from 'unzipper';
import { Path } from './path';
import { errorMessage } from './error/construct';
import { BytesData } from './bytesData';
import { Failable } from './error/failable';

export class ZipFile {
  private promise: Promise<CentralDirectory>;
  private path: Path;

  constructor(path: Path) {
    this.path = path;
    this.promise = Open.file(path.path);
  }

  async getFile(path: string): Promise<Failable<BytesData>> {
    const file = (await this.promise).files.find((d) => d.path == path);
    if (file === undefined)
      return errorMessage.data.path.notFound({
        type: 'file',
        path: this.path.path + '(' + path + ')',
      });
    return BytesData.fromBuffer(await file.buffer());
  }
}
