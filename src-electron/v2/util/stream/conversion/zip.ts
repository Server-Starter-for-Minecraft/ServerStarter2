import archiver from 'archiver';
import path from 'path';
import * as stream from 'stream';
import * as unzip from 'unzipper';
import { Drain } from '../deain';
import {
  Conversion,
  EntryData,
  EntryStats,
  Readable,
  StreamKind,
} from '../stream';

class ZipExtract extends stream.Transform {
  private extract: stream.Duplex;

  constructor() {
    super({ readableObjectMode: true });
    this.extract = unzip.Parse();

    this.extract.on('error', (e) => this.destroy(e));

    this.extract.on('entry', (entry) => {
      const readable: stream.Readable = entry;
      const stats: EntryStats = {
        // mode: undefined,
        // uid: undefined,
        // gid: undefined,
        size: entry.vars.uncompressedSize,
        mtime: entry.vars.lastModifiedDateTime,
        other: {
          zip: {
            compressionMethod: entry.vars.compressionMethod,
          },
        },
      };

      const readableStream = Readable.fromBinStream(readable);

      let dat: EntryData;
      if (entry.type === 'File') {
        dat = {
          type: 'FILE',
          path: entry.path,
          readable: readableStream,
          stats,
        };
      } else {
        dat = {
          type: 'DIR',
          path: entry.path,
          stats,
        };
        readableStream.into(new Drain(false));
      }
      this.push(dat);
    });
  }

  _transform(
    chunk: Buffer,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    if (!this.extract.write(chunk)) {
      this.extract.once('drain', callback);
    } else {
      callback();
    }
  }

  _final(callback: (error?: Error | null | undefined) => void): void {
    this.extract.once('close', callback);
  }
}

export const fromZip = () =>
  new Conversion<StreamKind.BIN, StreamKind.ENTRY>(new ZipExtract());

class ZipPack extends stream.Transform {
  private pack: archiver.Archiver;

  constructor(options?: archiver.ArchiverOptions) {
    super({ writableObjectMode: true });
    this.pack = archiver('zip', options);

    this.pack.on('data', (chunk) => {
      if (!this.push(chunk)) {
        this.pause();
        this.pack.once('drain', () => this.resume());
      }
    });
  }

  _transform(
    entry: EntryData,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    if (entry.type === 'FILE') {
      this.pack.append(entry.readable.stream, {
        name: path.basename(entry.path),
        prefix: path.dirname(entry.path),
        date: entry.stats?.mtime,
        mode: entry.stats?.mode,
      });
      this.pause();
      entry.readable.stream.on('end', () => {
        this.resume();
        callback();
      });
    } else {
      callback();
    }
  }

  _final(callback: (error?: Error | null | undefined) => void): void {
    this.pack.finalize();
    this.pack.once('end', callback);
  }
}

export const toZip = () =>
  new Conversion<StreamKind.ENTRY, StreamKind.BIN>(new ZipPack());

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  const { MemDir } = await import('../memdir');
  const { Path } = await import('../path');
  const { Bytes } = await import('../bytes');

  test('', async () => {
    const testdir = new Path('./userData/test');
    await testdir.mkdir();

    const src = new Path('src-electron/v2/util/stream/conversion/test/src.zip');
    const tgt = testdir.child('tgt.zip');
    await tgt.remove();

    const tarfile = src.file.createReadStream();

    const memdir = (await tarfile.convert(fromZip()).into(MemDir)).value();

    await memdir.convert(toZip()).into(tgt.file);

    const tgtContent = (await tgt.file.into(Bytes)).value();

    // srcContent と tgtContent は等価にならない...

    // TODO: @nozz-mat @MojaMonchi @txkodo 日本語含むファイルと巨大なファイルで検証
  });
}
