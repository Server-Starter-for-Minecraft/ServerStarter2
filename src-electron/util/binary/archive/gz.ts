// GZIP圧縮に関するutil
import * as zlib from 'zlib';
import { Failable } from '../../../schema/error';
import { isError } from '../../error/error';
import { BytesData } from '../bytesData';
import { Path } from '../path';

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
    return new Promise<Failable<BytesData>>(async (resolve, reject) => {
      const bytesData = await BytesData.fromBuffer(content.data);
      if (isError(bytesData)) return reject(bytesData);

      zlib.gzip(bytesData.arrayBuffer(), (err, binary) => {
        if (err !== null) reject(err);
        resolve(BytesData.fromBuffer(binary));
      });
    });
  }

  // gzipから元のデータを生成
  static async unpackData(content: BytesData): Promise<Failable<BytesData>> {
    return new Promise<Failable<BytesData>>(async (resolve, reject) => {
      const bytesData = await BytesData.fromBuffer(content.data);
      if (isError(bytesData)) return reject(bytesData);

      zlib.gunzip(bytesData.arrayBuffer(), (err, binary) => {
        if (err !== null) reject(err);
        resolve(BytesData.fromBuffer(binary));
      });
    });
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

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

      expect(isError(txtFile)).toBe(false);
      if (isError(txtFile)) return;

      // gzip圧縮
      const compressed = await gzip.fromFile(txtPath);

      expect(isError(compressed)).toBe(false);
      if (isError(compressed)) return;

      // gzipを保存
      await compressed.write(compressedPath.path);

      // gzip解凍
      const unCompressed = await gzip.unpackFile(compressedPath);

      expect(isError(unCompressed)).toBe(false);
      if (isError(unCompressed)) return;

      // 元ファイルと「圧縮->解凍」したファイルが一致するか確認
      expect(await txtFile.text()).toBe(await unCompressed.text());
    });

    test('text', async () => {
      // ランダムなバイト列で検証
      const sampleBytes = Buffer.from('test');
      const src = await BytesData.fromBuffer(sampleBytes);

      expect(isError(src)).toBe(false);
      if (isError(src)) return;

      // gzip圧縮
      const compressed = await gzip.fromData(src);

      expect(isError(compressed)).toBe(false);
      if (isError(compressed)) return;

      // gzip解凍
      const unCompressed = await gzip.unpackData(compressed);

      expect(isError(unCompressed)).toBe(false);
      if (isError(unCompressed)) return;

      // 元データと「圧縮->解凍」したデータが一致するか確認
      expect(await src.text()).toBe(await unCompressed.text());
    });
  });
}
