import fetch, { BodyInit, HeadersInit, Response } from 'electron-fetch';
import * as stream from 'stream';
import { URL } from 'url';
import { err, ok, Result } from '../base';
import { Bytes } from './bytes';
import { DuplexStreamer, Readable } from './stream';

// TODO: @txkodo NewTypeを使うべき
type UrlMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type UrlOption = {
  /** URL にアクセスするときのメソッド */
  method?: UrlMethod;
  /** URL にアクセス際のヘッダの内容 */
  headers?: Record<string, string>;
  /** URL にアクセス際のリクエストボディ */
  body?: BodyInit;
};

/**
 * URL & リクエスト をまとめて保持するクラス
 *
 * HeadersInit, BodyInit, Response は node のものではなく electron-fetch のものである点に注意
 */
export class Url extends DuplexStreamer<Response> {
  // URLデータ
  readonly url: URL;

  // リクエストパラメータ等の設定
  readonly option: UrlOption;

  constructor(url: string | URL, option?: UrlOption) {
    super();
    this.url = typeof url === 'string' ? new URL(url) : url;
    this.option = option ?? {};
  }

  /** URLそのままリクエストを変えた新しいUrlを返す
   *
   *  headerはマージしたものを返す
  */
  with(option: UrlOption) {
    const newOption = { ...this.option, ...option };
    newOption.headers = { ...(this.option.headers ?? {}), ...(option.headers ?? {}) };
    return new Url(this.url, newOption);
  }

  /** リクエストそのまま新しい子URLを返す
   *
   *  URLパラメータは取り除いて返す
   */
  child(path: string) {
    const basePath = this.url.pathname.replace(/\/+$/, '');
    const newPath = `${basePath}/${path}`.replace(/\/+$/, '');
    const newUrl = new URL(newPath, this.url.origin);
    return new Url(newUrl, this.option);
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

    // TODO: Url.child のテストを書く
    // url:https://example.com の child(foo) が url:https://example.com/foo になってればOK
    // その際、optionの値に変化があってはいけない
    const testUrl = new Url('https://example.com', {
      method: 'GET',
      headers: { foo: 'bar' },
      body: 'bodyTest',
    });

    expect(testUrl.child('foo')).toEqual(
      new Url('https://example.com/foo', {
        method: 'GET',
        headers: { foo: 'bar' },
        body: 'bodyTest',
      })
    );
    expect(testUrl.child('foo/bar')).toEqual(
      new Url('https://example.com/foo/bar', {
        method: 'GET',
        headers: { foo: 'bar' },
        body: 'bodyTest',
      })
    );
    expect(testUrl.child('foo').child('bar')).toEqual(
      new Url('https://example.com/foo/bar', {
        method: 'GET',
        headers: { foo: 'bar' },
        body: 'bodyTest',
      })
    );
    expect(testUrl.child('')).toEqual(
      new Url('https://example.com', {
        method: 'GET',
        headers: { foo: 'bar' },
        body: 'bodyTest',
      })
    );

    const testUrl1 = new Url('https://example.com/hoge', {
      method: 'GET',
      headers: { foo: 'bar' },
      body: 'bodyTest',
    });
    expect(testUrl1.child('fuga')).toEqual(
      new Url('https://example.com/hoge/fuga', {
        method: 'GET',
        headers: { foo: 'bar' },
        body: 'bodyTest',
      })
    );

    const testUrl2 = new Url('https://example.com/hoge/', {
      method: 'GET',
      headers: { foo: 'bar' },
      body: 'bodyTest',
    });
    expect(testUrl2.child('fuga')).toEqual(
      new Url('https://example.com/hoge/fuga', {
        method: 'GET',
        headers: { foo: 'bar' },
        body: 'bodyTest',
      })
    );

    // TODO: Url.with のテストを書く
    // option:{method:'GET',headers:{foo:bar}} の with({method:'POST'}) が option:{method:'POST',headers:{foo:bar}} になってればOK
    // その際、urlの値に変化があってはいけない
    expect(testUrl.with({ method: 'POST' })).toEqual(
      new Url('https://example.com', {
        method: 'POST',
        headers: { foo: 'bar' },
        body: 'bodyTest',
      })
    );
    expect(testUrl.with({ headers: { hoge: 'fuga' } })).toEqual(
      new Url('https://example.com', {
        method: 'GET',
        headers: { foo: 'bar', hoge: 'fuga' },
        body: 'bodyTest',
      })
    );
    expect(testUrl.with({ headers: { foo: 'fuga' } })).toEqual(
      new Url('https://example.com', {
        method: 'GET',
        headers: { foo: 'fuga' },
        body: 'bodyTest',
      })
    );
    expect(testUrl.with({ method: 'PUT' }).with({ body: 'hoge' })).toEqual(
      new Url('https://example.com', {
        method: 'PUT',
        headers: { foo: 'bar' },
        body: 'hoge',
      })
    );
    expect(
      testUrl.with({
        method: 'POST',
        headers: { bar: 'fuga', fizz: 'buzz' },
        body: 'hogehoge',
      })
    ).toEqual(
      new Url('https://example.com', {
        method: 'POST',
        headers: { foo: 'bar', bar: 'fuga', fizz: 'buzz' },
        body: 'hogehoge',
      })
    );
    expect(testUrl.with({})).toEqual(
      new Url('https://example.com', {
        method: 'GET',
        headers: { foo: 'bar' },
        body: 'bodyTest',
      })
    );
    expect(testUrl.with({ headers: { foo: '' } })).toEqual(
      new Url('https://example.com', {
        method: 'GET',
        headers: { foo: '' },
        body: 'bodyTest',
      })
    );
    expect(testUrl.with({ headers: { 'f-oo': '' } })).toEqual(
      new Url('https://example.com', {
        method: 'GET',
        headers: { foo: 'bar', 'f-oo': '' },
        body: 'bodyTest',
      })
    );

    expect(testUrl2.with({ body: 'testTest' })).toEqual(
      new Url('https://example.com/hoge/', {
        method: 'GET',
        headers: { foo: 'bar' },
        body: 'testTest',
      })
    );

    const testUrl3 = new Url('https://example.com/hoge/');
    expect(testUrl3.with({method: 'GET', headers: { foo: 'bar', 'ho-ge': 'fuga'}, body: 'bodybody'})).toEqual(
      new Url('https://example.com/hoge/', {
        method: 'GET',
        headers: { foo: 'bar', 'ho-ge': 'fuga' },
        body: 'bodybody',
      })
    )
  });
}
