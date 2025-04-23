import { decode } from 'iconv-lite';
import * as JSZip from 'jszip';
import { keys, values } from 'app/src-public/scripts/obj/obj';
import { errorMessage } from '../../error/construct';
import { isError } from '../../error/error';
import { Failable, safeExecAsync } from '../../error/failable';
import { fromEntries, toEntries } from '../../obj/obj';
import { asyncMap, objMap } from '../../obj/objmap';
import { BytesData } from '../bytesData';
import { Path } from '../path';

class ZipHandler {
  files: Promise<
    Failable<{
      [key: string]: () => Promise<Failable<BytesData>>;
    }>
  >;

  constructor(path: Path) {
    this.files = this.getfiles(path);
  }

  private async getfiles(path: Path): Promise<
    Failable<{
      [key: string]: () => Promise<Failable<BytesData>>;
    }>
  > {
    const data = await path.read();
    if (isError(data)) return data;
    const zipData = await safeExecAsync(() =>
      JSZip.loadAsync(new Uint8Array(data.data), {
        // TODO:shift-jis 固定で大丈夫？
        decodeFileName: (name) =>
          decode(Buffer.from(name as Uint8Array), 'shift-jis'),
      })
    );
    if (isError(zipData))
      return errorMessage.data.zip.invalidZipFile({ path: path.str() });
    const getBytesData = (innerPath: string, v: JSZip.JSZipObject) => {
      let dat: Failable<BytesData> | undefined = undefined;
      return async () => {
        if (dat !== undefined) return dat;
        if (v.dir) {
          dat = errorMessage.data.zip.isDir({
            path: path.path,
            innerPath,
          });
        } else {
          dat = await BytesData.fromBuffer(
            Buffer.from(await v.async('arraybuffer'))
          );
        }
        return dat;
      };
    };
    const result = objMap(zipData.files, (k, v) => [k, getBytesData(k, v)]);
    return result;
  }
}

export class ZipFile {
  private handler: ZipHandler;
  path: Path;

  constructor(path: Path) {
    this.path = path;
    this.handler = new ZipHandler(path);
  }

  async getFile(path: string): Promise<Failable<BytesData>> {
    const files = await this.handler.files;
    if (isError(files)) return files;
    const file = toEntries(files).find(([_path]) => _path === path)?.[1];
    if (file === undefined)
      return errorMessage.data.path.notFound({
        type: 'file',
        path: `${this.path.path}(${path})`,
      });
    return await file();
  }

  async hasFile(path: string): Promise<Failable<boolean>> {
    const files = await this.handler.files;
    if (isError(files)) return files;
    return Object.keys(files).some((_path) => _path === path);
  }

  /** 正規表現にあったパスを持つファイルの一覧を返す */
  async match(
    pattern: RegExp
  ): Promise<Failable<Record<string, Failable<BytesData>>>> {
    const files = await this.handler.files;
    if (isError(files)) return files;
    const zipObjectsEntries = toEntries(files).filter(([_path]) =>
      _path.match(pattern)
    );
    const awaited = await asyncMap(
      zipObjectsEntries,
      async ([k, v]): Promise<[string, Failable<BytesData>]> => [k, await v()]
    );
    return fromEntries<Record<string, Failable<BytesData>>>(awaited);
  }

  /** zipを展開 */
  async extract(path: Path): Promise<Failable<void>> {
    const files = await this.handler.files;
    if (isError(files)) return files;
    const ents = toEntries(files);
    await asyncMap(ents, async ([k, v]) => {
      const data = await v();
      if (isError(data)) return data;
      return path.child(k).write(data);
    });
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('zipFile', async () => {
    const { Path } = await import('../path');

    test('file', async () => {
      const testPath = new Path(__dirname).child('test', 'sample.zip');
      const tgtPath = new Path(__dirname).child('work', 'zip');
      await tgtPath.emptyDir();

      // 指定したZipを解凍
      const zip = new ZipFile(testPath);
      const extractRes = await zip.extract(tgtPath);

      expect(isError(extractRes)).toBe(false);
      if (isError(extractRes)) return;

      // 解凍結果のファイル数を確認
      const paths = await tgtPath.iter();
      if (isError(paths)) return;

      expect(paths.length).toBe(3);
    });

    test('iterateZip', async () => {
      const testPath = new Path(__dirname).child('test', 'sample.zip');

      // 指定したZipの中身を確認
      const zip = new ZipFile(testPath);
      const isFileExists = await zip.hasFile('sample2.txt');
      if (isError(isFileExists)) return;
      expect(isFileExists).toBe(true);

      // Zipの中から特定のファイルの情報を取得
      const file = await zip.getFile('sample2.txt');
      if (isError(file)) return;
      expect(await file.text()).toBe('Hello World!');

      // 正規表現で一覧を絞る
      const matched = await zip.match(/sample\d\.txt/);
      if (isError(matched) || values(matched).filter(isError).length > 0)
        return;
      expect(new Set(keys(matched))).toEqual(
        new Set(['sample1.txt', 'sample2.txt', 'sample3.txt'])
      );
    });
  });
}
