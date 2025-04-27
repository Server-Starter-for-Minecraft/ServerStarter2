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
    write(chunk, _, callback) {
      buffers.push(chunk);
      callback();
    },
  });

  await new Promise<Failable<undefined>>(async (resolve) => {
    const path = directoryPath.path;
    const inner = await directoryPath.iter();
    if (isError(inner)) return resolve(inner);

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
      .on('finish', resolve)
      .on('error', (e) => resolve(fromRuntimeError(e)));
  });
  return BytesData.fromBuffer(
    Buffer.concat(buffers.map((buff) => Uint8Array.from(buff)))
  );
}

export async function decompressTar(
  tarPath: Path,
  targetPath: Path
): Promise<Failable<void>> {
  return await safeExecAsync(() =>
    x({
      file: tarPath.path,
      cwd: targetPath.path,
    })
  );
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

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

      expect(isError(txtFile)).toBe(false);
      if (isError(txtFile)) return;

      // tar圧縮
      const compressed = await createTar(txtPath.parent());

      expect(isError(compressed)).toBe(false);
      if (isError(compressed)) return;

      // tarを保存
      await compressed.write(compressedPath.path);

      // tar解凍
      await decompressTar(compressedPath, workPath);
      const decompressedFile = await BytesData.fromPath(
        workPath.child('sample.txt')
      );

      expect(isError(decompressedFile)).toBe(false);
      if (isError(decompressedFile)) return;

      // 元ファイルと「圧縮->解凍」したファイルが一致するか確認
      expect(await txtFile.text()).toBe(await decompressedFile.text());
    });
  });
}
