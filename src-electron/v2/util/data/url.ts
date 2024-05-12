import * as stream from 'stream';
import fetch from 'electron-fetch';
import { Result, err, ok } from '../base';
import { DuplexStreamer, Readable, WritableStreamer } from './stream';
import { Bytes } from './bytes';

export type UrlOption = {};

export class Url implements DuplexStreamer<void> {
  readonly url: string;
  readonly option: UrlOption | undefined;

  constructor(url: string, option?: UrlOption) {
    this.url = url;
    this.option = option;
  }

  createReadStream(): Readable {
    const read = new stream.PassThrough();
    fetch(this.url, {}).then(({ body }) => {
      if (typeof body === 'string') {
        body = new Bytes(Buffer.from(body)).createReadableStream();
      } else {
        body = body;
      }
      body.pipe(read);
    });

    return new Readable(read);
  }

  convert(duplex: stream.Duplex): Readable {
    return this.createReadStream().convert(duplex);
  }

  to<T>(target: WritableStreamer<T>): Promise<Result<T, Error>> {
    return this.createReadStream().to(target);
  }

  write(readable: stream.Readable): Promise<Result<void, Error>> {
    throw new Error('Method not implemented.');
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', async () => {
    const a = await new Url('https://example.com').to(Bytes);
    console.log(a.value.data.toString());
    const { Path } = await import('./path');

    await new Url('https://example.com').to(
      new Path('./userData/example.html')
    );
  });
}
