import * as stream from 'stream';
import { Err, Result, err, ok } from '../base';
import { Readable, ReadableStreamer, WritableStreamer } from './stream';

export class Bytes implements ReadableStreamer {
  static write(readable: stream.Readable): Promise<Result<Bytes, Error>> {
    const buffers: Buffer[] = [];
    let e: undefined | Err<Error> = undefined;

    readable.on('error', (error) => (e = err(error)));

    readable.on('data', (chunk) => buffers.push(chunk));

    return new Promise<Result<Bytes, Error>>((resolve) => {
      readable.on('close', () => {
        if (e !== undefined) return resolve(e);
        resolve(ok(new Bytes(Buffer.concat(buffers))));
      });
    });
  }

  readonly data: Buffer;

  constructor(data: Buffer) {
    this.data = data;
  }

  createReadStream(): Readable {
    return new Readable(this.createReadableStream());
  }

  createReadableStream(): stream.Readable {
    const readable = new stream.Readable();
    const len = this.data.byteLength;
    let i = 0;

    readable._read = (n) => {
      if (len <= i) return readable.push(null);
      readable.push(this.data.subarray(i, i + n));
      i += n;
    };

    return readable;
  }

  convert(duplex: stream.Duplex): Readable {
    return this.createReadStream().convert(duplex);
  }

  to<T>(target: WritableStreamer<T>): Promise<Result<T, Error>> {
    return this.createReadStream().to(target);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('bytes', async () => {
    const bytes = new Bytes(Buffer.from('hello world / こんにちは世界'));
    const copy = await bytes.to(Bytes);
    expect(copy.value.data.toString('utf8')).toBe(
      'hello world / こんにちは世界'
    );
  });
}
