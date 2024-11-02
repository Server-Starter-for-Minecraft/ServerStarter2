import path from 'path';
import { err, ok } from '../../util/base';
import { bytesize } from '../../util/binary/bytesize';
import { SHA1 } from '../../util/binary/hash';
import { Path } from '../../util/binary/path';
import { ReadableStreamer, WritableStreamer } from '../../util/binary/stream';
import { sleep } from '../../util/promise/sleep';

/**
 * ハッシュ値とバイトサイズを検証しつつファイルに書き込む
 *
 * 検証に失敗した場合はファイル削除
 */
export async function writeWithChecksum(
  readable: ReadableStreamer,
  path: Path,
  hash?: {
    hasher: WritableStreamer<string>;
    value: string;
  },
  size?: number
) {
  const rs = readable.createReadStream();
  const [realHash, realSize, writeRes] = await Promise.all([
    hash !== undefined ? rs.into(hash.hasher) : undefined,
    size !== undefined ? rs.into(bytesize) : undefined,
    rs.into(path),
  ]);
  sleep(100);
  if (writeRes.isErr) return writeRes;
  if (realHash !== undefined) {
    if (realHash.isErr) {
      await path.remove();
      return realHash;
    }
    if (realHash.value() !== hash?.value) {
      await path.remove();
      return err.error('HASH MISMATCH');
    }
  }
  if (realSize !== undefined) {
    if (realSize.isErr) {
      await path.remove();
      return realSize;
    }
    if (realSize.value() !== size) {
      await path.remove();
      return err.error('SIZE MISMATCH');
    }
  }
  return ok();
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');
  const { Bytes } = await import('../../util/binary/bytes');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child(
    'work',
    path.basename(__filename, '.ts')
  );
  workPath.mkdir();

  const successCases = [
    { explain: '何もなし' },
    { explain: 'サイズのみ', size: 5 },
    {
      explain: 'hashのみ',
      hash: {
        hasher: SHA1,
        value: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
      },
    },
    {
      explain: 'size+hash',
      hash: {
        hasher: SHA1,
        value: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
      },
      size: 5,
    },
  ];
  test.each(successCases)('$explain', async (testCase) => {
    const tgtPath = workPath.child('success.txt');
    const writeResult = await writeWithChecksum(
      Bytes.fromString('hello'),
      tgtPath,
      testCase.hash,
      testCase.size
    );
    expect(writeResult.isOk).toBe(true);
    expect((await tgtPath.readText()).value()).toBe('hello');
  });

  const failCases = [
    { explain: 'サイズちがい', size: 1 },
    {
      explain: 'hashちがい',
      hash: {
        hasher: SHA1,
        value: '0000000000000000000000000000000000000000',
      },
    },
    {
      explain: 'sizeちがい+hash',
      hash: {
        hasher: SHA1,
        value: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
      },
      size: 1,
    },
    {
      explain: 'size+hashちがい',
      hash: {
        hasher: SHA1,
        value: '0000000000000000000000000000000000000000',
      },
      size: 5,
    },
  ];
  test.each(failCases)('$explain', async (testCase) => {
    const tgtPath = workPath.child('fail.txt');
    const writeResult = await writeWithChecksum(
      Bytes.fromString('hello'),
      tgtPath,
      testCase.hash,
      testCase.size
    );
    expect(writeResult.isErr).toBe(true);
    expect(tgtPath.exists()).toBe(false);
  });
}
