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
