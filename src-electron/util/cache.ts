import { Failable } from '../schema/error';
import { errorMessage } from './error/construct';
import { isValid } from './error/error';

/**
 * 値を安全に読み書きするためのハンドラ
 *
 * - 排他制御により同時に複数の読み書きが発生しないためデータが破損しない
 * - キャッシュにより一度取得したデータを高速で再取得できる
 */
export class CacheableAccessor<T> {
  private getter: () => Promise<Failable<T>>;
  private setter: (value: T) => Promise<Failable<void>>;
  private lock: undefined | Promise<any>;
  private value: Failable<T>;

  constructor(
    getter: () => Promise<Failable<T>>,
    setter: (value: T) => Promise<Failable<void>>
  ) {
    this.getter = getter;
    this.setter = setter;
    this.lock = undefined;
    this.value = errorMessage.data.path.loadingFailed({
      type: 'file',
      path: 'cache',
    });
  }

  /**
   * @param options.useCache [default : true] キャッシュデータがある場合それを使用する (高速)
   */
  async get(
    options: { useCache: boolean } = { useCache: true }
  ): Promise<Failable<T>> {
    await this.lock;
    if (options.useCache && isValid(this.value)) return this.value;
    this.lock = this.getter();
    this.value = await this.lock;
    return this.value;
  }

  async set(value: T): Promise<void> {
    await this.lock;
    this.lock = this.setter(value);
    await this.lock;
    this.value = value;
  }
}
