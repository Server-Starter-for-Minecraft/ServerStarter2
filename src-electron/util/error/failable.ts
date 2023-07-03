import { ErrorMessage, Failable } from '../../schema/error';
import { fromRuntimeError, isValid } from './error';

// 失敗値の場合デフォルト値で上書きする
export const orDefault = <T>(value: Failable<T>, defaultValue: T): T =>
  isValid(value) ? value : defaultValue;

/** 関数を実行しエラーが投げられた場合ErrorMeassageにして返す */
export function safeExec<T>(throwFunc: () => T): Failable<T> {
  try {
    return throwFunc();
  } catch (e) {
    return fromRuntimeError(e);
  }
}

/** 非同期関数を実行しエラーが投げられた場合ErrorMeassageにして返す */
export async function safeExecAsync<T>(
  throwFunc: () => Promise<T>
): Promise<Failable<T>> {
  try {
    return await throwFunc();
  } catch (e) {
    return fromRuntimeError(e);
  }
}

/**
 * エラーを投げる可能性のある関数をFailable化する
 * 基本的にsafeExec/safeExecAsyncで十分だと思う
 */
export function failabilify<P extends any[], R>(
  func: (...args: P) => R
): (
  ...args: P
) => R extends Promise<infer S> ? Promise<Failable<S>> : Failable<R> {
  const arrowed = (...args: P) => func(...args);
  return ((...args: P) => {
    try {
      const result = arrowed(...args);
      if (result instanceof Promise) {
        const inner = async () => {
          try {
            return await result;
          } catch (e) {
            return fromRuntimeError(e);
          }
        };
        return inner();
      } else {
        return result;
      }
    } catch (e) {
      return fromRuntimeError(e);
    }
  }) as (
    ...args: P
  ) => R extends Promise<infer S> ? Promise<Failable<S>> : Failable<R>;
}

/** Failableを連鎖して評価するためのクラス */
export class FailableChain<T> {
  constructor(value: Failable<T>) {
    this.value = value;
  }

  value: Failable<T>;

  orDefault = (defaultValue: T) =>
    isValid(this.value) ? this.value : defaultValue;

  chain<U>(
    onValid: (value: T) => Failable<U>,
    onError?: (value: ErrorMessage) => Failable<U>
  ) {
    let result: Failable<U>;
    if (isValid(this.value)) {
      result = onValid(this.value);
    } else {
      if (onError === undefined) {
        result = this.value;
      } else {
        result = onError(this.value);
      }
    }
    return new FailableChain<U>(result);
  }
}

export type { Failable };
