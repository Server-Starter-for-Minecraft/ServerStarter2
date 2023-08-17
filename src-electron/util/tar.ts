import { c, x } from 'tar';
import { Writable } from 'stream';
import { BytesData } from './bytesData';
import { Path } from './path';
import { Failable } from '../schema/error';
import { fromRuntimeError } from './error/error';

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
    const path = directoryPath.str();
    const inner = await directoryPath.iter();
    c(
      {
        gzip,
        portable: true,
        cwd: path + '/',
        // preservePaths: true,
      },
      inner.map((x) => x.basename())
    )
      .pipe(bufferStream)
      .on('finish', resolve)
      .on('error', (e) => resolve(fromRuntimeError(e)));
  });
  return BytesData.fromBuffer(Buffer.concat(buffers));
}

export async function decompressTar(
  tarPath: Path,
  targetPath: Path
): Promise<void> {
  await x({
    file: tarPath.str(),
    cwd: targetPath.str(),
  });
}
