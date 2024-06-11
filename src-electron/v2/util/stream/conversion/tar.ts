import * as stream from 'stream';
import * as tar from 'tar-stream';
import { Drain } from '../deain';
import { Conversion, EntryData, Readable, StreamKind } from '../stream';
import { WritableStream } from '../util';

class TarExtract extends stream.Transform {
  private extract: tar.Extract;

  constructor() {
    super({ readableObjectMode: true });
    this.extract = tar.extract();

    this.extract.on('entry', (h, stream, next) => {
      switch (h.type) {
        case 'file':
          this.push({
            type: 'FILE',
            path: h.name,
            readable: Readable.fromBinStream(stream),
            stats: {
              mode: h.mode,
              uid: h.uid,
              gid: h.gid,
              size: h.size,
              mtime: h.mtime,
              other: {
                tar: {
                  linkname: h.linkname,
                },
              },
            },
          });
          break;
        case 'directory':
          this.push({
            type: 'DIR',
            path: h.name,
            stats: {
              mode: h.mode,
              uid: h.uid,
              gid: h.gid,
              size: h.size,
              mtime: h.mtime,
              other: {
                tar: {
                  linkname: h.linkname,
                },
              },
            },
          });
          // ストリームを廃棄
          Readable.fromBinStream(stream).into(new Drain(false));
          break;
        default:
          // ストリームを廃棄
          Readable.fromBinStream(stream).into(new Drain(false));
          break;
      }
      stream.on('close', next);
    });
  }

  _transform(
    chunk: Buffer,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    if (!this.extract.write(chunk)) {
      this.extract.once('drain', () => {
        callback();
      });
    } else {
      callback();
    }
  }
}

export const fromTar = () =>
  new Conversion<StreamKind.BIN, StreamKind.ENTRY>(new TarExtract());

class TarPack extends stream.Transform {
  private pack: tar.Pack;

  constructor() {
    super({ writableObjectMode: true });
    this.pack = tar.pack();

    this.pack.on('data', (chunk) => {
      this.push(chunk);
    });
  }

  _transform(
    chunk: EntryData,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    if (chunk.type === 'FILE') {
      this.pause();
      const writable = this.pack.entry(
        { name: chunk.path, type: 'file', ...chunk.stats },
        () => {
          this.resume();
          callback();
        }
      );
      writable;
      chunk.readable.into(new WritableStream(writable));
    } else {
      const writable = this.pack.entry(
        { name: chunk.path, type: 'directory', ...chunk.stats },
        () => {
          this.resume();
          callback();
        }
      );
      // ディレクトリなので何も書かずに終了
      writable.end();
    }
  }

  _final(callback: (error?: Error | null | undefined) => void): void {
    this.pack.finalize();
    this.pack.once('end', callback);
  }
}

export const toTar = () =>
  new Conversion<StreamKind.ENTRY, StreamKind.BIN>(new TarPack());

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  const { MemDir } = await import('../memdir');
  const { Path } = await import('../path');
  const { Bytes } = await import('../bytes');

  test('', async () => {
    const testdir = new Path('./userData/test');

    const src = new Path('src-electron/v2/util/stream/conversion/test/tar.tgz');
    const tgt = testdir.child('tar.tgz');
    await tgt.remove();

    const srcContent = (await src.file.into(Bytes)).value();

    const tarfile = src.file.createReadStream();

    const memdir = (await tarfile.convert(fromTar()).into(MemDir)).value();

    await memdir.convert(toTar()).into(tgt.file);

    // const tgtContent = (await tgt.file.into(Bytes)).value();

    // srcContent と tgtContent は等価にならない...

    // await tgt.remove();

    // TODO: @nozz-mat @MojaMonchi @txkodo 日本語含むファイルと巨大なファイルで検証
  });
}
