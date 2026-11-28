import { Writable } from 'stream';
import { c, x } from 'tar';
import { Failable } from '../../../schema/error';
import { fromRuntimeError, isError } from '../../error/error';
import { safeExecAsync } from '../../error/failable';
import { BytesData } from '../bytesData';
import { Path } from '../path';

export async function createTar(
  directoryPath: Path,
  gzip = true
): Promise<Failable<BytesData>> {
  const buffers: Buffer[] = [];
  const bufferStream = new Writable({
    write(chunk: Buffer, _, callback) {
      buffers.push(chunk);
      callback();
    },
  });

  const path = directoryPath.path;
  const inner = await directoryPath.iter();
  if (isError(inner)) return inner;

  const result = await new Promise<Failable<undefined>>((resolve) => {
    c(
      {
        gzip,
        portable: true,
        cwd: `${path}/`,
        // preservePaths: true,
      },
      inner.map((x) => x.basename())
    )
      .pipe(bufferStream)
      .on('finish', () => resolve(undefined))
      .on('error', (e) => resolve(fromRuntimeError(e)));
  });
  if (isError(result)) return result;
  return BytesData.fromBuffer(
    Buffer.concat(buffers.map((buff) => Uint8Array.from(buff)))
  );
}

export async function decompressTar(
  tarPath: Path,
  targetPath: Path
): Promise<Failable<void>> {
  return safeExecAsync(async () =>
    x({
      file: tarPath.path,
      cwd: targetPath.path,
    })
  );
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
      const workPath = testPath.parent().child('work', 'tar');

      const txtPath = testPath.child('sample.txt');
      const compressedPath = workPath.child('sample.tar.gz');
      await workPath.emptyDir();

      // testフォルダからファイルを読込
      const txtFile = await BytesData.fromPath(txtPath);

      assertOk(txtFile);

      // tar圧縮
      const compressed = await createTar(txtPath.parent());

      assertOk(compressed);

      // tarを保存
      await compressed.write(compressedPath.path);

      // tar解凍
      await decompressTar(compressedPath, workPath);
      const decompressedFile = await BytesData.fromPath(
        workPath.child('sample.txt')
      );

      assertOk(decompressedFile);

      // 元ファイルと「圧縮->解凍」したファイルが一致するか確認
      expect(await txtFile.text()).toBe(await decompressedFile.text());
    });
  });
}
