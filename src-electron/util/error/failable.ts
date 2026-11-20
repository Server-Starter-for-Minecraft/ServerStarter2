import { ErrorMessage, Failable } from '../../schema/error';
import { fromRuntimeError, isValid } from './error';

/**
 * 失敗値の場合はデフォルト値で上書きする
 *
 * エラーを握りつぶさないよう，失敗した場合はエラーを必ず `onError`（ロガーなど）へ渡す
 *
 * @param value 失敗しうる値
 * @param defaultValue 失敗した場合に使う値
 * @param onError 失敗した場合にエラーを渡す処理（ロガーなど）
 * @returns 成功した場合はその値，失敗した場合はデフォルト値
 */
export const orDefault = <T>(
  value: Failable<T>,
  defaultValue: T,
  onError: (error: ErrorMessage) => void
): T => {
  if (isValid(value)) return value;
  onError(value);
  return defaultValue;
};

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
  return (async (...args: P) => {
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
        return await inner();
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

  orDefault = (defaultValue: T, onError: (error: ErrorMessage) => void) =>
    orDefault(this.value, defaultValue, onError);

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
