import archiver from 'archiver';
import * as stream from 'stream';
import { Extract } from 'unzipper';
import { Result } from '../../base';
import { sleep } from '../../promise/sleep';
import { Path } from '../path';
import { Readable, WritableStreamer } from '../stream';
import { asyncPipe } from '../util';
import { Archiver } from './archive';

type ZipExtractOptions = {
  concurrency: number;
};

class Zip extends WritableStreamer<void> {
  readonly pathObj: Path;
  readonly optsObj?: ZipExtractOptions;

  constructor(path: Path, opts?: ZipExtractOptions) {
    super();
    this.pathObj = path;
  }

  // 単一のZipをフォルダに展開
  write(readable: stream.Readable): Promise<Result<void, Error>> {
    const str = Extract({
      ...this.optsObj,
      forceStream: false,
      path: this.pathObj.path,
      verbose: false,
    });
    str.on('close', () => console.log('close'));
    return asyncPipe(readable, str);
  }
}

export const zipArchiver: Archiver<
  archiver.ArchiverOptions,
  ZipExtractOptions
> = {
  pack(path, opts) {
    const archive = archiver('zip', opts);
    archive.directory(path.path, false);
    return new Readable(archive);
  },
  extract(path, opts) {
    return new Zip(path, opts);
  },
};

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', async () => {
    const srcPath = new Path(
      'src-electron/v2/util/stream/archive/test/src.zip'
    );
    const tgtPath = new Path('userData/test/zipDir');
    console.log(tgtPath.exists());
    await tgtPath.remove();
    console.log(tgtPath.exists());
    await srcPath.into(zipArchiver.extract(tgtPath, { concurrency: 10 }));
    console.log('aa');
    await sleep(100);
  });
}
