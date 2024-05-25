import fetch, { BodyInit, HeadersInit, Response } from 'electron-fetch';
import * as stream from 'stream';
import { URL } from 'url';
import { err, ok, Result } from '../base';
import { Bytes } from './bytes';
import { DuplexStreamer, Readable } from './stream';

export type UrlOption = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
};

/**
 * URL & リクエスト をまとめて保持するクラス
 *
 * HeadersInit, BodyInit, Response は node のものではなく electron-fetch のものである点に注意
 */
export class Url extends DuplexStreamer<Response> {
  readonly url: URL;
  readonly option: UrlOption;

  constructor(url: string | URL, option?: UrlOption) {
    super();
    this.url = typeof url === 'string' ? new URL(url) : url;
    this.option = option ?? {};
  }

  /** URLそのままリクエストを変えた新しいUrlを返す */
  with(option: UrlOption) {
    return new Url(this.url, { ...this.option, ...option });
  }

  /** リクエストそのまま新しい子URLを返す */
  child(path: string) {
    return new Url(new URL(path, this.url));
  }

  createReadStream(): Readable {
    const read = new stream.PassThrough();
    fetch(this.url.toString(), this.option).then(({ body }) => {
      if (typeof body === 'string') {
        body = new Bytes(Buffer.from(body)).createReadableStream();
      } else {
        body = body;
      }
      body.pipe(read);
    });
    return new Readable(read);
  }

  write(readable: stream.Readable): Promise<Result<Response, Error>> {
    return fetch(this.url.toString(), { ...this.option, body: readable })
      .then(ok)
      .catch(err);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('stream check', async () => {
    const bytes = await new Url('https://dummyjson.com/test').into(Bytes);

    expect(JSON.parse(bytes.value.toString())).toEqual({
      status: 'ok',
      method: 'GET',
    });

    const { Path } = await import('./path');

    const tgt = new Path('./userData/example.json');
    await new Url('https://dummyjson.com/test').into(tgt);

    expect(JSON.parse((await tgt.readText()).value)).toEqual({
      status: 'ok',
      method: 'GET',
    });

    // TODO: Url.child Url.with のテストを書く
  });
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('', () => {
    test('', () => {});
  });
}
