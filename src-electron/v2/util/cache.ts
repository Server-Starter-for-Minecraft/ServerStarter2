import { err, ok, Result } from './base';

/**
 * 値を安全に読み書きするためのハンドラ
 *
 * - 排他制御により同時に複数の読み書きが発生しないためデータが破損しない
 * - キャッシュにより一度取得したデータを高速で再取得できる
 */
export class CacheableAccessor<T> {
  private getter: () => Promise<Result<T>>;
  private setter: (value: T) => Promise<Result<void>>;
  private lock: undefined | Promise<any>;
  private value: Result<T>;

  constructor(
    getter: () => Promise<Result<T>>,
    setter: (value: T) => Promise<Result<void>>
  ) {
    this.getter = getter;
    this.setter = setter;
    this.lock = undefined;
    this.value = err.error('unloaded');
  }

  /**
   * @param options.useCache [default : true] キャッシュデータがある場合それを使用する (高速)
   */
  async get(
    options: { useCache: boolean } = { useCache: true }
  ): Promise<Result<T>> {
    await this.lock;
    if (options.useCache && this.value.isOk) return this.value;
    this.lock = this.getter();
    this.value = await this.lock;
    return this.value;
  }

  async set(value: T): Promise<Result<void>> {
    await this.lock;
    this.lock = this.setter(value);
    await this.lock;
    this.value = ok(value);
    return ok();
  }
}
