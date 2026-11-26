import iconv from 'iconv-lite';
import JSZip from 'jszip';
import { keys, values } from 'app/src-public/scripts/obj/obj';
import { errorMessage } from '../../error/construct';
import { isError } from '../../error/error';
import { Failable, safeExecAsync } from '../../error/failable';
import { fromEntries, toEntries } from '../../obj/obj';
import { asyncMap, objMap } from '../../obj/objmap';
import { BytesData } from '../bytesData';
import { Path } from '../path';

/** Zip 内の1項目（ファイルまたはフォルダ） */
type ZipEntry = {
  /** フォルダの項目（例: `MyMap/`）かどうか */
  isDir: boolean;
  /** 項目の内容を読み込む（フォルダの項目の場合はエラー） */
  read: () => Promise<Failable<BytesData>>;
};

class ZipHandler {
  files: Promise<Failable<Record<string, ZipEntry>>>;

  constructor(path: Path) {
    this.files = this.getfiles(path);
  }

  private async getfiles(
    path: Path
  ): Promise<Failable<Record<string, ZipEntry>>> {
    const data = await path.read();
    if (isError(data)) return data;
    const zipData = await safeExecAsync(async () =>
      JSZip.loadAsync(new Uint8Array(data.data), {
        // TODO:shift-jis 固定で大丈夫？
        decodeFileName: (name) =>
          iconv.decode(
            // 型定義は string[] だが，JSZip が配列で渡すのはバイト値の配列（Uint8Array を使えない環境の場合）
            Buffer.from(Array.isArray(name) ? name.map(Number) : name),
            'shift-jis'
          ),
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
    const result = objMap(zipData.files, (k, v) => [
      k,
      { isDir: v.dir, read: getBytesData(k, v) },
    ]);
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
    return file.read();
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
      async ([k, v]): Promise<[string, Failable<BytesData>]> => [
        k,
        await v.read(),
      ]
    );
    return fromEntries<Record<string, Failable<BytesData>>>(awaited);
  }

  /**
   * zipを展開
   *
   * フォルダの項目（例: `MyMap/`）は，中身が空のフォルダも残るようにフォルダとして作成する
   *
   * @param path 展開先のフォルダ
   * @returns 1つでも展開できない項目があった場合はエラー
   */
  async extract(path: Path): Promise<Failable<void>> {
    const files = await this.handler.files;
    if (isError(files)) return files;
    const ents = toEntries(files);
    const results = await asyncMap(ents, async ([k, v]) => {
      if (v.isDir) {
        // Path.mkdir は失敗時に例外を投げるため，Result 型へ変換する（os/shell.ts の openFolder と同じ扱い）
        const dirPath = path.child(k);
        const made = await safeExecAsync(async () => dirPath.mkdir());
        if (isError(made))
          return errorMessage.data.path.creationFailed({
            type: 'directory',
            path: dirPath.path,
          });
        return;
      }
      const data = await v.read();
      if (isError(data)) return data;
      return path.child(k).write(data);
    });
    // 1つでも展開できなかった場合はエラーを返す
    return results.find(isError);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  // アサーション関数は型注釈のある名前でしか呼べないため，型を明示して取り出す
  const assertions = await import('app/test/util/assert');
  const assertOk: typeof assertions.assertOk = assertions.assertOk;

  describe('zipFile', async () => {
    const { Path } = await import('../path');

    test('file', async () => {
      const testPath = new Path(__dirname).child('test', 'sample.zip');
      const tgtPath = new Path(__dirname).child('work', 'zip');
      await tgtPath.emptyDir();

      // 指定したZipを解凍
      const zip = new ZipFile(testPath);
      const extractRes = await zip.extract(tgtPath);

      assertOk(extractRes);

      // 解凍結果のファイル数を確認
      const paths = await tgtPath.iter();
      assertOk(paths);

      expect(paths.length).toBe(3);
    });

    test('フォルダの項目を含むzipを展開できる', async () => {
      const { default: JSZip } = await import('jszip');
      const workPath = new Path(__dirname).child('work', 'zipWithDir');
      await workPath.emptyDir();

      // 一般的なツールで作った zip と同様に，フォルダの項目（`MyMap/`など）を含める
      const zipData = new JSZip();
      zipData.folder('MyMap');
      zipData.folder('MyMap/empty');
      zipData.file('MyMap/level.dat', 'level');
      const zipPath = workPath.child('MyMap.zip');
      const bytes = await BytesData.fromBuffer(
        await zipData.generateAsync({ type: 'nodebuffer' })
      );
      assertOk(bytes);
      await zipPath.write(bytes);

      const tgtPath = workPath.child('extracted');
      const extractRes = await new ZipFile(zipPath).extract(tgtPath);
      assertOk(extractRes);

      const level = await tgtPath.child('MyMap', 'level.dat').readText();
      expect(level).toBe('level');
      // 中身が空のフォルダも展開される
      expect(await tgtPath.child('MyMap', 'empty').isDirectory()).toBe(true);
    });

    test('iterateZip', async () => {
      const testPath = new Path(__dirname).child('test', 'sample.zip');

      // 指定したZipの中身を確認
      const zip = new ZipFile(testPath);
      const isFileExists = await zip.hasFile('sample2.txt');
      expect(isFileExists).toBe(true);

      // Zipの中から特定のファイルの情報を取得
      const file = await zip.getFile('sample2.txt');
      assertOk(file);
      expect(await file.text()).toBe('Hello World!');

      // 正規表現で一覧を絞る
      const matched = await zip.match(/sample\d\.txt/);
      assertOk(matched);
      expect(values(matched).filter(isError)).toEqual([]);
      expect(new Set(keys(matched))).toEqual(
        new Set(['sample1.txt', 'sample2.txt', 'sample3.txt'])
      );
    });
  });
}
