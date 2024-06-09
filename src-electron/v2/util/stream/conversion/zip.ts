import * as stream from 'stream';
import * as unzip from 'unzipper';
import { sleep } from '../../promise/sleep';
import { Bytes } from '../bytes';
import { MemDir } from '../memdir';
import { Path } from '../path';
import { Conversion, EntryData, StreamKind } from '../stream';

class ZipExtract extends stream.Transform {
  private extract: stream.Duplex;

  constructor() {
    super({ readableObjectMode: true });
    this.extract = unzip.Parse();

    this.extract.on('entry', (entry) => {
      console.log(entry);

      const dat: EntryData = { header: entry.vars, stream: entry };

      this.push(dat);
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

export const fromZip = () =>
  new Conversion<StreamKind.BIN, StreamKind.ENTRY>(new ZipExtract());

// class ZipPack extends stream.Transform {
//   private pack: tar.Pack;
//   private finalcb = () => {};

//   constructor() {
//     super({ writableObjectMode: true });
//     this.pack = tar.pack();

//     this.pack.on('data', (chunk) => {
//       this.push(chunk);
//     });

//     this.pack.on('end', () => {
//       this.finalcb();
//     });
//   }

//   _transform(
//     chunk: EntryData,
//     encoding: string,
//     callback: (error?: Error | null) => void
//   ): void {
//     chunk.stream.pipe(
//       this.pack.entry(chunk.header, () => {
//         chunk.next();
//         this.resume();
//         callback();
//       })
//     );
//     this.pause();
//   }

//   _final(callback: (error?: Error | null | undefined) => void): void {
//     this.pack.finalize();
//     this.finalcb = callback;
//   }
// }

// export const toTar = () =>
//   new Conversion<StreamKind.ENTRY, StreamKind.BIN>(new TarPack());

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', async () => {
    const testdir = new Path('./userData/test');

    const src = new Path('src-electron/v2/util/stream/conversion/test/src.zip');
    const tgt = testdir.child('tgt.zip');
    await tgt.remove();

    const tarfile = src.file.createReadStream();

    const memdir = (await tarfile.convert(fromZip()).into(MemDir)).value();

    await sleep(1000);

    // await memdir.convert(toTar()).into(tgt.file);

    // const tgtContent = (await tgt.file.into(Bytes)).value();

    // srcContent と tgtContent は等価にならない...

    await tgt.remove();
  });
}
