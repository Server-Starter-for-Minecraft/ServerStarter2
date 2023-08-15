import { Path } from './path';
import { errorMessage } from './error/construct';
import { BytesData } from './bytesData';
import { Failable } from './error/failable';
import { isError } from 'src/scripts/error';
import * as JSZip from 'jszip';
import { fromEntries, toEntries } from './obj';
import { asyncMap } from './objmap';

export class ZipFile {
  private files: Promise<
    Failable<{
      [key: string]: JSZip.JSZipObject;
    }>
  >;
  path: Path;

  constructor(path: Path) {
    this.path = path;
    this.files = this.getfiles(path);
  }

  private async getfiles(path: Path) {
    const data = await path.read();
    if (isError(data)) return data;
    const zipData = await JSZip.loadAsync(new Uint8Array(data.data));
    return zipData.files;
  }

  async getFile(path: string): Promise<Failable<BytesData>> {
    const files = await this.files;
    if (isError(files)) return files;
    const file = toEntries(files).find(([_path]) => _path === path)?.[1];
    if (file === undefined)
      return errorMessage.data.path.notFound({
        type: 'file',
        path: this.path.path + '(' + path + ')',
      });
    return BytesData.fromBuffer(await file.async('arraybuffer'));
  }

  async hasFile(path: string): Promise<Failable<boolean>> {
    const files = await this.files;
    if (isError(files)) return files;
    return Object.keys(files).some((_path) => _path === path);
  }

  /** 正規表現にあったパスを持つファイルの一覧を返す */
  async match(pattern: RegExp): Promise<Failable<Record<string, Failable<BytesData>>>> {
    const files = await this.files;
    if (isError(files)) return files;
    const zipObjectsEntries = toEntries(files).filter(([_path]) =>
      _path.match(pattern)
    );
    const awaited = await asyncMap(
      zipObjectsEntries,
      async ([k, v]): Promise<[string, Failable<BytesData>]> => [
        k,
        await BytesData.fromBuffer(await v.async('arraybuffer')),
      ]
    );
    return fromEntries<Record<string, Failable<BytesData>>>(awaited);
  }

  /** zipを展開 */
  async extract(path: Path) {
    const files = await this.files;
    if (isError(files)) return files;
    const ents = toEntries(files);
    await asyncMap(ents, async ([k, v]) => {
      const data = await BytesData.fromBuffer(await v.async('arraybuffer'));
      if (isError(data)) return data;
      return path.child(k).write(data);
    });
  }
}
