import * as stream from 'stream';
import { Err, err, ok, Result } from '../base';
import { Readable, ReadableStreamer, StreamKind } from './stream';

export class Bytes extends ReadableStreamer<StreamKind.BIN> {
  static write(readable: Readable<StreamKind.BIN>): Promise<Result<Bytes>> {
    const buffers: Buffer[] = [];
    const rs = readable.stream;
    let e: undefined | Err<Error> = undefined;

    rs.on('error', (error) => (e = err(error)));

    rs.on('data', (chunk) => buffers.push(chunk));

    return new Promise<Result<Bytes, Error>>((resolve) => {
      rs.on('close', () => {
        try {
          if (e !== undefined) return resolve(e);
          resolve(ok(new Bytes(Buffer.concat(buffers))));
        } catch (error) {
          resolve(err(error as Error));
        }
      });
    });
  }

  readonly data: Buffer;

  constructor(data: Buffer) {
    super();
    this.data = data;
  }

  /** 文字列からBytesを生成 (デフォルト utf8) */
  static fromString(data: string, encoding: BufferEncoding = 'utf8') {
    return new Bytes(Buffer.from(data, encoding));
  }

  /** Bytesを文字列化 (デフォルト utf8) */
  toStr(encoding: BufferEncoding = 'utf8'): Result<string> {
    try {
      return ok(this.data.toString(encoding));
    } catch (e) {
      return err(e as Error);
    }
  }

  createReadStream(): Readable<StreamKind.BIN> {
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
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('bytes', async () => {
    const bytes = new Bytes(Buffer.from('hello world / こんにちは世界'));
    const copy = await bytes.into(Bytes);
    expect(copy.value().data.toString('utf8')).toBe(
      'hello world / こんにちは世界'
    );
  });
}
