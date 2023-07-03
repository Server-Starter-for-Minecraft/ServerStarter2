import { ErrorMessage, WithError } from '../../schema/error';


export function withError<T>(value: T, errors?: ErrorMessage[]): WithError<T> {
  return { value, errors: errors ?? [] };
}

/** WithErrorを連鎖して評価するためのクラス */
export class WithErrorChain<T> {
  constructor(value: WithError<T>) {
    this.value = value;
  }
  value: WithError<T>;

  // 関数を実行してエラーを結合
  chain<U>(func: (value: T) => WithError<U>): WithError<U> {
    const result = func(this.value.value);
    return withError(result.value, this.value.errors.concat(result.errors));
  }
}
