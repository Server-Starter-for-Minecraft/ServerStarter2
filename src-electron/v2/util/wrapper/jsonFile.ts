import { z, ZodTypeDef } from 'zod';
import { err, ok, Result } from '../base';
import { Path } from '../binary/path';
import { CacheableAccessor } from '../cache';

/**
 * JSON文字列を扱うクラス
 */
export class JsonSourceHandler<T> {
  private accessor: CacheableAccessor<T>;

  private constructor(accessor: CacheableAccessor<T>) {
    this.accessor = accessor;
  }

  /** ローカルにあるJSONを扱う */
  static fromPath<T>(
    path: Path,
    validator: z.ZodSchema<T, ZodTypeDef, any>,
    options?: { encoding?: BufferEncoding }
  ) {
    const getter = async (): Promise<Result<T>> => {
      const jsonResult = (await path.readText(options?.encoding)).onOk((x) =>
        Result.catchSync(() => JSON.parse(x))
      );
      const result = jsonResult.valueOrDefault(undefined);

      const validated = await validator.safeParseAsync(result);
      if (validated.success) return ok(validated.data);
      return err(validated.error);
    };

    const setter = async (value: T): Promise<Result<void>> => {
      const str = Result.catchSync(() => JSON.stringify(value));
      if (str.isErr) return str;
      return await path.writeText(str.value(), options?.encoding);
    };

    const accessor = new CacheableAccessor<T>(getter, setter);
    return new JsonSourceHandler(accessor);
  }

  /**
   * JSONを読み込む
   */
  read = (
    options: { useCache: boolean } = { useCache: false }
  ): Promise<Result<T>> => this.accessor.get(options);

  /**
   * JSONを書き込む
   */
  write = (content: T): Promise<Result<void>> => this.accessor.set(content);
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', async () => {
    const { Path } = await import('../binary/path');
    const testPath = new Path('userData/test');
    await testPath.mkdir();
    const jsonPath = testPath.child('a.json');
    await jsonPath.remove();

    type A = {
      a: number;
      b: string;
    };

    const jsonHandler = JsonSourceHandler.fromPath<A>(
      jsonPath,
      z
        .object({
          a: z.number().default(1),
          b: z.string().default('hello'),
        })
        .default({})
    );

    const content = await jsonHandler.read();
    expect(content.value()).toEqual({ a: 1, b: 'hello' });

    await jsonHandler.write({ a: 2, b: 'world' });
    expect((await jsonPath.readText()).value()).toBe('{"a":2,"b":"world"}');

    expect((await jsonHandler.read({ useCache: true})).value()).toEqual({ a: 2, b: 'world' });

    await jsonPath.writeText('{"a": 3}')
    expect((await jsonHandler.read({ useCache: true})).value()).toEqual({ a: 2, b: 'world' });
    expect((await jsonHandler.read({ useCache: false})).value()).toEqual({ a: 3, b: 'hello' });
  });
}
