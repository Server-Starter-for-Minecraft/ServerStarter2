import { z, ZodTypeDef } from 'zod';
import { Path } from '../binary/path';
import { CacheableAccessor } from '../cache';
import { fromRuntimeError, isError } from '../error/error';
import { Failable } from '../error/failable';

/**
 * JSON文字列を扱うクラス
 */
export class JsonSourceHandler<T> {
  private accessor: CacheableAccessor<T>;

  private constructor(accessor: CacheableAccessor<T>) {
    this.accessor = accessor;
  }

  /**
   * ローカルにあるJSONを扱う
   *
   * `validator`には必ずDefaultを設定した状態のZodSchemaを渡すこと
   */
  static fromPath<T>(
    path: Path,
    validator: z.ZodDefault<z.ZodSchema<T, ZodTypeDef, any>>,
    options?: { encoding?: BufferEncoding }
  ) {
    const getter = async (): Promise<Failable<T>> => {
      let jsonResult: Failable<T> = await path.readJson(
        validator,
        options?.encoding
      );
      if (isError(jsonResult)) jsonResult = {} as T;

      const validated = await validator.safeParseAsync(jsonResult);
      if (validated.success) return validated.data;
      return fromRuntimeError(validated.error);
    };

    const setter = async (value: T): Promise<Failable<void>> => {
      return path.writeJson(value, options?.encoding);
    };

    const accessor = new CacheableAccessor<T>(getter, setter);
    return new JsonSourceHandler(accessor);
  }

  /**
   * JSONを読み込む
   */
  read = (
    options: { useCache: boolean } = { useCache: false }
  ): Promise<Failable<T>> => this.accessor.get(options);

  /**
   * JSONを書き込む
   */
  write = (content: T): Promise<void> => this.accessor.set(content);
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', async () => {
    const { Path } = await import('../binary/path');
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();
    const jsonPath = workPath.child('a.json');
    await jsonPath.remove();

    const A = z
      .object({
        a: z.number().default(1),
        b: z.string().default('hello'),
      })
      .default({});

    const jsonHandler = JsonSourceHandler.fromPath(jsonPath, A);

    const content = await jsonHandler.read();
    expect(isError(content)).toBe(false);
    if (isError(content)) return;
    expect(content).toEqual({ a: 1, b: 'hello' });

    await jsonHandler.write({ a: 2, b: 'world' });
    const readTxt = await jsonPath.readText();
    expect(isError(readTxt)).toBe(false);
    if (isError(readTxt)) return;
    expect(readTxt).toBe('{"a":2,"b":"world"}');
  });
}
