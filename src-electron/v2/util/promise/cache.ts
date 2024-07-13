import { err, ok, Result } from '../base';

/**
 * getとsetがある非同期処理の結果をキャッシュする
 *
 * - getterは取得する
 * - setterは変換して更新する
 */
export class AsyncCache<T, U> {
  private getter: () => Promise<Result<T>>;
  private setter: (value: U) => Promise<Result<T>>;
  private value: Result<T>;

  constructor(
    getter: () => Promise<Result<T>>,
    setter: (value: U) => Promise<Result<T>>
  ) {
    this.getter = getter;
    this.setter = setter;
    this.value = err.error('initial');
  }

  async get(): Promise<Result<T>> {
    if (this.value.isErr) this.value = await this.getter();
    return this.value;
  }

  async set(value: U): Promise<Result<void>> {
    const setResult = await this.setter(value);
    return setResult.onOk(() => {
      this.value = setResult;
      return ok();
    });
  }

  flush() {
    this.value = err.error('flushed');
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect, vi } = import.meta.vitest;
  const { sleep } = await import('./sleep');

  describe('AsyncCache', () => {
    test('使用例', async () => {
      let store = 0;

      // ほんとはファイルからの読み取りとかURL GETとかを書く
      const getter = vi.fn(async () => {
        await sleep(100);
        return ok(store);
      });

      // ほんとはファイルへの書き込みとかURL POSTとかを書く
      const setter = vi.fn(async (value: string) => {
        await sleep(100);
        store = value.length;
        return ok(value.length);
      });

      const numCache = new AsyncCache(getter, setter);

      expect(getter).toBeCalledTimes(0); // getterは必要になるまで呼ばれない

      expect((await numCache.get()).value()).toBe(0);
      expect((await numCache.get()).value()).toBe(0);
      expect((await numCache.get()).value()).toBe(0);

      expect(getter).toBeCalledTimes(1); // getterは一度だけ呼び出される

      expect((await numCache.set('test')).value()).toBe(undefined);
      expect((await numCache.set('test')).value()).toBe(undefined);

      expect(setter).toBeCalledTimes(2); // setterはsetの回数だけ呼び出される

      expect(store).toBe(4);

      expect((await numCache.get()).value()).toBe(4); // 値が更新されている

      expect(getter).toBeCalledTimes(1); // setをたたいてもgetterは実行されない

      numCache.flush();

      expect(getter).toBeCalledTimes(1); // flushをたたいてもgetter実行されない

      expect((await numCache.get()).value()).toBe(4); // 値が更新されている

      expect(getter).toBeCalledTimes(2); // flushをたたいた後にgetするとgetterが実行される
    });
  });
}
