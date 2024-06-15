import archiver from 'archiver';
import * as stream from 'stream';
import { Extract, Parse } from 'unzipper';
import { Result } from '../../base';
import { Path } from '../path';
import { Readable, ReadableStreamer, WritableStreamer } from '../stream';
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

/**
 * zip内のそれぞれのファイルに対して処理を実行
 * @param readable
 * @param mapFunc zipファイル内部でのパスとReadableを受ける関数 かならず引数のreadableに対してintoを実行すること
 */
export async function iterateZip(
  readable: ReadableStreamer,
  mapFunc: (path: string, readable: Readable) => Promise<void>
) {
  const parse = Parse({
    forceStream: true,
    verbose: false,
  });
  const pipe = asyncPipe(readable.createReadStream().stream, parse);
  for await (const entry of parse) {
    const stream = new Readable(entry);
    console.log(entry.path);
    await mapFunc(entry.path, stream);
  }
  await pipe;
}

/** In Source Testing */
if (import.meta.vitest) {
  const { Bytes } = await import('../bytes');

  const { test, expect } = import.meta.vitest;
  test('', async () => {
    // TODO: @MojaMonchi @nozz-mat 解凍 + 圧縮 のテスト作成
    const srcPath = new Path(
      'src-electron/v2/util/binary/archive/test/src.zip'
    );
    const tgtPath = new Path('userData/test/zipDir');
    await tgtPath.remove();
    await srcPath.into(zipArchiver.extract(tgtPath, { concurrency: 10 }));
  });
  test('iterateZip', async () => {
    const srcPath = new Path(
      'src-electron/v2/util/binary/archive/test/src.zip'
    );
    console.log(srcPath.exists());
    await iterateZip(srcPath, async (path, stream) => {
      console.log(
        (await stream.into(Bytes)).onOk((b) => b.toStr('utf-8')).value()
      );
    });
    console.log(srcPath.exists());
  });
}

// srcPath.into(zipArchiver.iterate((header,stream) => { if(header) {const bytes = await stream.into(Bytes); const json = await bytes.into(json(z...)); json} }))
