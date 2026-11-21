import { z } from 'zod';
import { Path } from '../binary/path';
import { CacheableAccessor } from '../cache';
import { isError } from '../error/error';
import { Failable } from '../error/failable';
import { utilLoggers } from '../utilLogger';

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
    validator: z.ZodType<T, any>,
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

      // 既定値を保存できなくても既定値で動作を続ける（保存の失敗はログに残す）
      const written = await setter(defaultVal.data);
      if (isError(written)) {
        utilLoggers().JsonSourceHandler({ path: path.path }).warn(written);
      }
      return defaultVal.data;
    };

    const accessor = new CacheableAccessor<T>(getter, setter);
    return new JsonSourceHandler(accessor);
  }

  /**
   * JSONを読み込む
   */
  read = async (
    options: { useCache: boolean } = { useCache: false }
  ): Promise<Failable<T>> => this.accessor.get(options);

  /**
   * JSONを書き込む
   */
  write = async (content: T): Promise<void> => this.accessor.set(content);
}

/** In Source Testing */
if (import.meta.vitest) {
  // アサーション関数は型注釈のある名前でしか呼べないため，型を明示して取り出す
  const assertions = await import('app/test/util/assert');
  const assertOk: typeof assertions.assertOk = assertions.assertOk;
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
      .prefault({});

    const jsonHandler = JsonSourceHandler.fromPath(jsonPath, A);

    const content = await jsonHandler.read();
    assertOk(content);
    expect(content).toEqual({ a: 1, b: 'hello' });

    await jsonHandler.write({ a: 2, b: 'world' });
    const readTxt = await jsonPath.readText();
    assertOk(readTxt);
    expect(readTxt).toBe('{"a":2,"b":"world"}');
  });
}
