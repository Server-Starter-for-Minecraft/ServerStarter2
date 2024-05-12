import * as stream from 'stream';
import { Err, Result, err, ok } from './base';

export type Collector<T, U> = (
  readable: Readable<T>
) => Promise<Result<U, Error>>;

export class Readable<T> {
  readonly stream: stream.Readable;
  private constructor(stream: stream.Readable) {
    this.stream = stream;
  }

  /**
   * 型を明示して指定すること
   */
  static fromNodeStream<T>(stream: stream.Readable) {
    return new Readable<T>(stream);
  }

  /**
   * ストリームのデータを一つのオブジェクトに集める
   */
  join<U>(collector: Collector<T, U>): Promise<Result<U, Error>> {
    return collector(this);
  }

  /**
   * stream.pipeの代わりに使う
   *
   * エラー処理をよしなにやってくれる + 型補完が効く
   */
  to(
    destination: Writable<T>,
    options?: { end?: boolean | undefined } | undefined
  ): Writable<T>;
  to(
    destination: Duplex<T>,
    options?: { end?: boolean | undefined } | undefined
  ): Duplex<T>;
  to(
    destination: Writable<T> | Duplex<T>,
    options?: { end?: boolean | undefined } | undefined
  ): Writable<T> | Duplex<T> {
    const _stream = this.stream
      .on('error', (e) => destination.stream.destroy(e))
      .pipe(destination.stream, options);
    if (_stream instanceof stream.Duplex) {
      return Duplex.fromNodeStream<T>(_stream);
    } else {
      return Writable.fromNodeStream<T>(_stream);
    }
  }
}

export class Writable<T> {
  readonly stream: stream.Writable;
  private constructor(stream: stream.Writable) {
    this.stream = stream;
  }

  /**
   * 型を明示して指定すること
   */
  static fromNodeStream<T>(stream: stream.Writable) {
    return new Writable<T>(stream);
  }

  /**
   * writeの終了を待つ
   */
  toPromise(): Promise<Result<undefined, Error>> {
    return new Promise<Result<undefined, Error>>((resolve) => {
      let res: Result<undefined, Error> = ok(undefined);
      this.stream.on('error', (e) => (res = err(e)));
      this.stream.on('close', () => resolve(res));
    });
  }
}

export class Duplex<T> {
  readonly stream: stream.Duplex;
  private constructor(stream: stream.Duplex) {
    this.stream = stream;
  }

  /**
   * 型を明示して指定すること
   */
  static fromNodeStream<T>(stream: stream.Duplex) {
    return new Duplex<T>(stream);
  }

  /**
   * ストリームのデータを一つのオブジェクトに集める
   */
  join<U>(collector: Collector<T, U>): Promise<Result<U, Error>> {
    return collector(this);
  }

  /**
   * stream.pipeの代わりに使う
   *
   * エラー処理をよしなにやってくれる + 型補完が効く
   */
  to(
    destination: Writable<T>,
    options?: { end?: boolean | undefined } | undefined
  ): Writable<T>;
  to(
    destination: Duplex<T>,
    options?: { end?: boolean | undefined } | undefined
  ): Duplex<T>;
  to(
    destination: Writable<T> | Duplex<T>,
    options?: { end?: boolean | undefined } | undefined
  ): Writable<T> | Duplex<T> {
    const _stream = this.stream
      .on('error', (e) => destination.stream.destroy(e))
      .pipe(destination.stream, options);
    if (_stream instanceof stream.Duplex) {
      return Duplex.fromNodeStream<T>(_stream);
    } else {
      return Writable.fromNodeStream<T>(_stream);
    }
  }
}

export class MemoryReadStream<T> extends stream.Readable {
  private _iter: AsyncIterator<T, any, undefined>;
  private constructor(
    iter: AsyncIterator<T>,
    objectMode: T extends string | Buffer ? false : true
  ) {
    super({ objectMode });
    this._iter = iter;
  }
  async _read() {
    const next = await this._iter.next();
    this.push(next.done ? null : next.value);
  }

  /** 配列を順に返すReadStream */
  static fromIterable<T>(
    iterable: Iterable<T>,
    objectMode: T extends string | Buffer ? false : true
  ): Readable<T> {
    const gen: AsyncGenerator<T, void, unknown> = (async function* () {
      for (const a of iterable) {
        yield a;
      }
      return;
    })();
    return Readable.fromNodeStream<T>(new MemoryReadStream(gen, objectMode));
  }

  static fromIterator<T>(
    iterator: Iterator<T>,
    objectMode: T extends string | Buffer ? false : true
  ): Readable<T> {
    const gen: AsyncGenerator<T, void, unknown> = (async function* () {
      let result = iterator.next();
      while (!result.done) {
        yield result.value;
        result = iterator.next();
      }
    })();
    return Readable.fromNodeStream<T>(new MemoryReadStream(gen, objectMode));
  }

  static fromAsyncIterator<T>(
    iterator: AsyncIterator<T>,
    objectMode: T extends string | Buffer ? false : true
  ): Readable<T> {
    return Readable.fromNodeStream<T>(
      new MemoryReadStream(iterator, objectMode)
    );
  }
}

/**
 * streamをstringにする
 */
export const toString: Collector<string, string> = (readable) => {
  const promise = readable.stream.reduce((p, d) => p + d, '');
  return promise.then(ok).catch(err);
};

/**
 * streamをBufferにする
 */
export const toBuffer: Collector<Buffer, Buffer> = (readable) => {
  const promise = readable.stream.reduce<Buffer[]>((p, d) => {
    p.push(d);
    return p;
  }, []);
  return promise.then((buffers) => ok(Buffer.concat(buffers))).catch(err);
};

/**
 * streamをArray<T>にする
 */
export const toArray = <T>(
  readable: Readable<T>
): Promise<Result<T[], Error>> => {
  const promise = readable.stream.reduce<T[]>((p, d) => {
    p.push(d);
    return p;
  }, []);
  return promise.then(ok).catch(err);
};

/**
 * streamをjsonとして解析する
 */
export const toJson: Collector<string, any> = (readable: Readable<string>) => {
  const promise = readable.stream.reduce((p, d) => p + d, '');
  return promise
    .then((x) => {
      try {
        return ok(JSON.parse(x));
      } catch (e) {
        return err(e as Error);
      }
    })
    .catch(err);
};

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  /**
   * 指定した文字列が1文字づつ流れてくるstream
   * 文字が "!" の場合エラーを流す
   */
  function createReadable(value: string) {
    const emit = {
      error: () => {},
    };

    const read = MemoryReadStream.fromIterator(
      (function* () {
        for (const char of Array.from(value)) {
          if (char === '!') emit.error();
          else yield char;
        }
      })(),
      false
    );

    emit.error = () => read.stream.emit('error', 'ERROR');
    return read;
  }

  /**
   * 流れてくる文字列が1文字づつ流れていくstream
   * 文字が "?" の場合エラーを流す
   */
  function createDuplex() {
    const _stream = new stream.PassThrough({
      transform(c: Buffer, _, fn) {
        if (c.toString('utf8') === '?') fn('ERROR' as unknown as Error);
        else fn(undefined, c);
      },
    });

    return Duplex.fromNodeStream<string>(_stream);
  }

  test('stream join test', async () => {
    const read1 = createReadable('1234');
    expect((await read1.join(toString)).value).toBe('1234');

    const read2 = createReadable('123!4');
    expect((await read2.join(toString)).error).toBe('ERROR');
  });

  test('stream to test', async () => {
    const read1 = createReadable('1234');
    const result1 = await read1.to(createDuplex()).join(toString);
    expect(result1.value).toBe('1234');

    const read2 = createReadable('123!4');
    const result2 = await read2.to(createDuplex()).join(toString);
    expect(result2.error).toBe('ERROR');

    const read3 = createReadable('123?4');
    const result3 = await read3.to(createDuplex()).join(toString);
    expect(result3.error).toBe('ERROR');

    const read4 = createReadable('123?4');
    const result4 = await read4
      .to(createDuplex())
      .to(createDuplex())
      .join(toString);
    expect(result4.error).toBe('ERROR');
  });
}
