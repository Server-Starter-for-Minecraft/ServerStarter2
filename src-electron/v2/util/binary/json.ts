import * as stream from 'stream';
import { z } from 'zod';
import { err, ok, Result } from '../base';
import { Bytes } from './bytes';
import { WritableStreamer } from './stream';

export class Json<T> extends WritableStreamer<T> {
  private validator: z.ZodType<T, z.ZodTypeDef, any>;

  constructor(validator: z.ZodType<T, z.ZodTypeDef, any>) {
    super();
    this.validator = validator;
  }

  async write(readable: stream.Readable): Promise<Result<T, Error>> {
    const bytes = await Bytes.write(readable);
    const data = bytes
      .onOk((x) => x.toStr())
      .onOk((x) => Result.catchSync(() => JSON.parse(x)))
      .onOk((x) => Result.fromZod(this.validator.safeParse(x)));
    return data;
  }

  stringify(data: T): Bytes {
    return Bytes.fromString(JSON.stringify(data));
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
      const json = new Json(testCase.validator);
      const jsonValue = await Bytes.fromString(testCase.jsonStr).into(json);

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

      const bytes = await jsonStream.stringify(testCase.data).into(Bytes);

      if ('jsonStr' in testCase)
        expect(bytes.value().toStr('utf8').value()).toBe(testCase.jsonStr);
      if ('error' in testCase) expect(bytes.error()).toBeInstanceOf(Error);
    });

    type TestCase = {
      explain: string;
      data: Result<any>;
    } & ({ jsonStr: string } | { error: Record<string, never> });
  });
}
