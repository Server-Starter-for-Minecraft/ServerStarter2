import { Err, err, Result } from '../util/base';

/** フロントにそのまま伝わる翻訳すべきエラーのスキーマ Record<strig,any> */
export type V2ErrorSchema = {
  unknown: string;
};

/** フロントにそのまま伝わる翻訳すべきエラー */
export class V2Error<
  T extends keyof V2ErrorSchema = keyof V2ErrorSchema
> extends Error {
  readonly key: T;
  readonly arg: V2ErrorSchema[T];
  constructor(key: T, arg: V2ErrorSchema[T]) {
    super();
    this.key = key;
    this.arg = arg;
  }
}

type V2ErrorFactory = {
  [K in keyof V2ErrorSchema]: {
    (arg: V2ErrorSchema[K]): V2Error<K>;
    fallback(arg: V2ErrorSchema[K]): (err: any) => Err<V2Error>;
    err(arg: V2ErrorSchema[K]): Err<V2Error>;
  };
};

/**
 * V2Errorを作成するためのオブジェクト
 *
 * ```
 * // V2Error<T>を作成
 * const myError:V2Error<"myError"> = v2Error.MY_ERR('arg')
 *
 * // Err<V2Error<T>>を作成
 * const myError:V2Error<"myError"> = v2Error.MY_ERR.err('arg')
 *
 * // okErrでResult<T>をResult<T,V2Error<'arg'>>にできる
 * // errがV2Errorの場合はそのまま、そうでない場合は指定したエラーになる
 * result //Result<T>
 * result.okErr(v2Error.MY_ERR.fallback('arg')) //Result<T,V2Error>
 * ```
 */
export const v2Error: V2ErrorFactory = new Proxy({} as V2ErrorFactory, {
  get<T extends keyof V2ErrorSchema>(_: any, key: T) {
    const result = (arg: V2ErrorSchema[T]) => new V2Error(key, arg);
    result.err = (arg: V2ErrorSchema[T]) => err(result(arg));
    result.fallback = (arg: V2ErrorSchema[T]) => (e: any) =>
      e instanceof V2Error ? e : result.err(arg);
    return result;
  },
});
