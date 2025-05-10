import { z, ZodTypeDef } from 'zod';
import { Path } from '../binary/path';
import { CacheableAccessor } from '../cache';
import { isError } from '../error/error';
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
   */
  static fromPath<T>(
    path: Path,
    validator: z.ZodSchema<T, ZodTypeDef, any>,
    options?: { encoding?: BufferEncoding }
  ) {
    const setter = async (value: T): Promise<Failable<void>> => {
      return path.writeJson(value, options?.encoding);
    };

    const getter = async (): Promise<Failable<T>> => {
      const res = await path.readJson(validator, options?.encoding);
      if (!isError(res)) return res;

      // Jsonの読み取りに失敗した場合は型定義で示されたDefaultでフォールバック
      const defaultVal = validator.safeParse({});
      if (!defaultVal.success) return res;

      await setter(defaultVal.data)
      return defaultVal.data;
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
  test('json handler', async () => {
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
