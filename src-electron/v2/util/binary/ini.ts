import * as stream from 'stream';
import { z } from 'zod';
import { err, ok, Result } from '../base';
import { Bytes } from './bytes';
import { WritableStreamer } from './stream';
import ini from 'ini';
import { x } from 'tar';

export class Ini<T extends Record<string, any>> extends WritableStreamer<T> {
  private validator: z.ZodType<T, z.ZodTypeDef, any>;

  constructor(validator: z.ZodType<T, z.ZodTypeDef, any>) {
    super();
    this.validator = validator;
  }

  async write(readable: stream.Readable): Promise<Result<T, Error>> {
    const bytes = await Bytes.write(readable);
    const data = bytes
      .onOk((x) => x.toStr())
      .onOk((x) => Result.catchSync(() => ini.parse(x)))
      .onOk((x) => Result.fromZod(this.validator.safeParse(this.transformJSONValues(x))));
    return data;
  }

  stringify(data: T): Bytes {
      const stringifyData = this.prepareForStringify(data)
      return Bytes.fromString(ini.stringify(stringifyData));
  }

  private transformJSONValues(data:Record<string, any>): any {
    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (typeof data[key] === 'string') {
          try {
            // JSON形式かを判定し、可能ならばパース
            const parsed = JSON.parse(data[key].replace(/(\w+):/g, '"$1":'));
            data[key] = parsed;
          } catch {
            // JSONでない場合はそのまま
            data[key] = isNaN(data[key]) ? data[key] : Number(data[key]);
          }
        } else if (typeof data[key] === 'object') {
          this.transformJSONValues(data[key]);
        }
      }
    }
    return data;
  }
  private prepareForStringify(data:Record<string, any>): any {
    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const key in data) {
        if (typeof data[key] === 'object' && data[key] !== null) {
          result[key] = this.stringifyNestedObject(data[key]);
        } else {
          result[key] = data[key];
        }
      }
      return result;
    }
    return data;
  }
  private stringifyNestedObject(data:Record<string, any>): any {
    const result: any = {};
    for (const key in data) {
      if (typeof data[key] === 'object' && data[key] !== null) {
        // 深さ2以上のネストされたオブジェクトのみをJSON文字列に変換
        result[key] = JSON.stringify(data[key]).replace(/"(\w+)":/g, '$1:');
      } else {
        result[key] = data[key];
      }
    }
    return result;
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('Ini書き込み', () => {
    const testCases: TestCase[] = [
      {
        explain: 'keyValue',
        iniStr: 'a=100\n',
        validator: z.object({ a : z.number()}),
        value: { a : 100 },
      },
      {
        explain: 'section',
        iniStr: '[a]\nb=100\n',
        validator: z.object({ a: z.object({ b : z.number() })}),
        value: { a: { b : 100} },
      },
      {
        explain: 'includeJson',
        iniStr: '[a]\nb=100\nc={d:100}\n',
        validator: z.object({ a: z.object({ b : z.number(), c : z.object({d : z.number() })})}),
        value: { a : {b : 100, c : { d : 100 }}},
      },
      {
        explain: 'nested',
        iniStr: '[a]\nb=100\nc={d:100}\n[x]\nb=123\nc={d:15}\n',
        validator: z.record( z.string(), z.object({ b : z.number(), c : z.object({d : z.number() })})),
        value: { a : {b : 100, c : { d : 100 }}, x : {b : 123, c : { d : 15 }}},
      },
      {
        explain: 'invalid ini',
        iniStr: '"a"',
        validator: z.string(),
        error: {},
      },
      {
        explain: 'mismatch schema',
        iniStr: '[a]\nb=100\n',
        validator: z.object({ a: z.number()}),
        error: {},
      },
    ];

    test.each(testCases)('$explain', async (testCase) => {
      const ini = new Ini(testCase.validator);
      const iniValue = await Bytes.fromString(testCase.iniStr).into(ini);
      if ('value' in testCase)
        expect(iniValue.value()).toStrictEqual(testCase.value);
      if ('error' in testCase) expect(iniValue.error()).toBeInstanceOf(Error);
    });

    type TestCase = {
      explain: string;
      iniStr: string;
      validator: z.ZodType<any>;
    } & ({ value: any } | { error: Record<string, never> });
  });

  describe('Ini書き出し', () => {
    // 実行時のオーバーヘッドを減らすため、書き出しの際はバリデーションしない.
    const testCases: TestCase[] = [
      {
        explain: 'keyValue',
        data: { a: 100 },
        iniStr: 'a=100\n',
      },
      {
        explain: 'section',
        data: { a: { b : 100} },
        iniStr: '[a]\nb=100\n',
      },
      {
        explain: 'includeJson',
        data: { a : {b : 100, c : { d : 100 }}},
        iniStr: '[a]\nb=100\nc={d:100}\n',
      },
      {
        explain: 'nested',
        data: { a : {b : 100, c : { d : 100 }}, x : {b : 123, c : { d : 15 }}},
        iniStr: '[a]\nb=100\nc={d:100}\n\n[x]\nb=123\nc={d:15}\n',
      },
    ];

    test.each(testCases)('$explain', async (testCase) => {
      const iniStream = new Ini(z.any());

      const bytes = await iniStream.stringify(testCase.data).into(Bytes);

      if ('iniStr' in testCase)
        expect(bytes.value().toStr('utf8').value()).toBe(testCase.iniStr);
      if ('error' in testCase) expect(bytes.error()).toBeInstanceOf(Error);
    });

    type TestCase = {
      explain: string;
      data: any;
    } & ({ iniStr: string } | { error: Record<string, never> });
  });
}
