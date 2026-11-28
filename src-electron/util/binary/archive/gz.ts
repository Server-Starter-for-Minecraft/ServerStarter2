// GZIP圧縮に関するutil
import { promisify } from 'util';
import * as zlib from 'zlib';
import { Failable } from '../../../schema/error';
import { isError } from '../../error/error';
import { safeExecAsync } from '../../error/failable';
import { BytesData } from '../bytesData';
import { Path } from '../path';

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

export class gzip {
  // ファイルからgzipを生成
  static async fromFile(path: Path): Promise<Failable<BytesData>> {
    const content = await path.read();
    if (isError(content)) return content;

    return this.fromData(content);
  }

  // gzipから元のファイルを生成
  static async unpackFile(path: Path): Promise<Failable<BytesData>> {
    const content = await path.read();
    if (isError(content)) return content;

    return this.unpackData(content);
  }

  // BytesDataからgzipを生成
  static async fromData(content: BytesData): Promise<Failable<BytesData>> {
    const binary = await safeExecAsync(async () => gzipAsync(content.data));
    if (isError(binary)) return binary;
    return BytesData.fromBuffer(binary);
  }

  // gzipから元のデータを生成
  static async unpackData(content: BytesData): Promise<Failable<BytesData>> {
    const binary = await safeExecAsync(async () => gunzipAsync(content.data));
    if (isError(binary)) return binary;
    return BytesData.fromBuffer(binary);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  // アサーション関数は型注釈のある名前でしか呼べないため，型を明示して取り出す
  const assertions = await import('app/test/util/assert');
  const assertOk: typeof assertions.assertOk = assertions.assertOk;

  describe('gzip', async () => {
    const { BytesData } = await import('../bytesData');

    test('file', async () => {
      const testPath = new Path(__dirname).child('test');
      const workPath = testPath.parent().child('work', 'gzip');

      const txtPath = testPath.child('sample.txt');
      const compressedPath = workPath.child('sample.txt.gz');
      await workPath.emptyDir();

      // testフォルダからファイルを読込
      const txtFile = await BytesData.fromPath(txtPath);

      assertOk(txtFile);

      // gzip圧縮
      const compressed = await gzip.fromFile(txtPath);

      assertOk(compressed);

      // gzipを保存
      await compressed.write(compressedPath.path);

      // gzip解凍
      const unCompressed = await gzip.unpackFile(compressedPath);

      assertOk(unCompressed);

      // 元ファイルと「圧縮->解凍」したファイルが一致するか確認
      expect(await txtFile.text()).toBe(await unCompressed.text());
    });

    test('text', async () => {
      // ランダムなバイト列で検証
      const sampleBytes = Buffer.from('test');
      const src = await BytesData.fromBuffer(sampleBytes);

      assertOk(src);

      // gzip圧縮
      const compressed = await gzip.fromData(src);

      assertOk(compressed);

      // gzip解凍
      const unCompressed = await gzip.unpackData(compressed);

      assertOk(unCompressed);

      // 元データと「圧縮->解凍」したデータが一致するか確認
      expect(await src.text()).toBe(await unCompressed.text());
    });
  });
}
