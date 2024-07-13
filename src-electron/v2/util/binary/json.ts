import * as stream from 'stream';
import { z } from 'zod';
import { err, ok, Result } from '../base';
import { Bytes } from './bytes';
import { DuplexStreamer, Readable } from './stream';

export class Json<T> extends DuplexStreamer<T> {
  private validator: z.ZodType<T, z.ZodTypeDef, any>;
  private _data: Result<T>;

  get data(): Result<T> {
    return this._data.onOk((x) => Result.catchSync(() => structuredClone(x)));
  }
  set data(data: Result<T>) {
    this._data = data.onOk((x) => Result.catchSync(() => structuredClone(x)));
  }

  constructor(validator: z.ZodType<T, z.ZodTypeDef, any>) {
    super();
    this.validator = validator;
    this._data = err.error('value is unset');
  }

  async write(readable: stream.Readable): Promise<Result<T, Error>> {
    const bytes = await Bytes.write(readable);
    this._data = bytes
      .onOk((x) => x.toStr())
      .onOk((x) => Result.catchSync(() => JSON.parse(x)))
      .onOk((x) => Result.fromZod(this.validator.safeParse(x)));
    return this.data;
  }

  createReadStream(): Readable {
    if (this._data.isErr) {
      const error = this._data.error();
      return new Readable(
        new stream.Readable({
          read() {
            this.destroy(error);
          },
        })
      );
    }
    return Bytes.fromString(
      JSON.stringify(this.data.value())
    ).createReadStream();
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('JsonStream書き込み', () => {
    const testCases: TestCase[] = [
      {
        explain: 'string',
        jsonStr: '"a"',
        validator: z.string(),
        value: 'a',
      },
      {
        explain: 'object',
        jsonStr: '{"a":100}',
        validator: z.object({ a: z.number() }),
        value: { a: 100 },
      },
      {
        explain: 'array',
        jsonStr: '[true,false]',
        validator: z.array(z.boolean()),
        value: [true, false],
      },
      {
        explain: 'invalid json',
        jsonStr: '"{a[',
        validator: z.string(),
        error: {},
      },
      {
        explain: 'mismatch schema',
        jsonStr: 'true',
        validator: z.number(),
        error: {},
      },
    ];

    test.each(testCases)('$explain', async (testCase) => {
      const jsonStream = new Json(testCase.validator);
      const jsonValue = await Bytes.fromString(testCase.jsonStr).into(
        jsonStream
      );

      if ('value' in testCase)
        expect(jsonValue.value()).toStrictEqual(testCase.value);
      if ('error' in testCase) expect(jsonValue.error()).toBeInstanceOf(Error);
    });

    type TestCase = {
      explain: string;
      jsonStr: string;
      validator: z.ZodType<any>;
    } & ({ value: any } | { error: Record<string, never> });
  });

  describe('JsonStream書き出し', () => {
    // 実行時のオーバーヘッドを減らすため、書き出しの際はバリデーションしない.
    const testCases: TestCase[] = [
      {
        explain: 'string',
        data: ok('a'),
        jsonStr: '"a"',
      },
      {
        explain: 'object',
        data: ok({ a: 100 }),
        jsonStr: '{"a":100}',
      },
      {
        explain: 'array',
        data: ok([true, false]),
        jsonStr: '[true,false]',
      },
      {
        explain: 'error',
        data: err.error('test error'),
        error: {},
      },
    ];

    test.each(testCases)('$explain', async (testCase) => {
      const jsonStream = new Json(z.any());
      jsonStream.data = testCase.data;

      const bytes = await jsonStream.into(Bytes);

      if ('jsonStr' in testCase)
        expect(bytes.value().toStr('utf8').value()).toBe(testCase.jsonStr);
      if ('error' in testCase) expect(bytes.error()).toBeInstanceOf(Error);
    });

    type TestCase = {
      explain: string;
      data: Result<any>;
    } & ({ jsonStr: string } | { error: Record<string, never> });
  });

  test('オブジェクト参照が切れている', async () => {
    const jsonStream = new Json(z.object({ a: z.number() }));

    await Bytes.fromString('{"a":100}').into(jsonStream);

    const getData = jsonStream.data.value();

    expect(getData).toStrictEqual({ a: 100 });

    getData.a = 200;
    expect(getData).toStrictEqual({ a: 200 });
    expect(jsonStream.data.value()).toStrictEqual({ a: 100 }); // 元データは変更されない

    const setData = { a: 300 };
    jsonStream.data = ok(setData);
    expect(jsonStream.data.value()).toStrictEqual({ a: 300 });
    setData.a = 400;
    expect(jsonStream.data.value()).toStrictEqual({ a: 300 }); // 元データは変更されない
  });
}
