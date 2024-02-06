import { Default } from './default';
import { Map } from './map';
import { Optional } from './optional';

const FAIL = Symbol();

export type Fail = {
  [FAIL]: typeof FAIL;
  paths: string[];
};

export function fail(paths: string[]): Fail {
  return {
    [FAIL]: FAIL,
    paths,
  };
}

export function isFail(value: any): value is Fail {
  return value[FAIL] === FAIL;
}

export class Fixer<T, FAILABLE extends boolean> {
  private func: (
    value: any,
    path: string
  ) => FAILABLE extends true ? T | Fail : T;

  constructor(
    func: (value: any, path: string) => FAILABLE extends true ? T | Fail : T
  ) {
    this.func = func;
  }

  fix(value: any, path?: string): FAILABLE extends true ? T | Fail : T {
    return this.func(value, path ?? '');
  }

  /** Fixに失敗した際にFailではなくデフォルト値を使用 */
  default(dafult: T): Fixer<T, false> {
    return Default(this, dafult);
  }

  /** Fixに失敗した際にFailではなくデフォルト値を使用 */
  optional(): Fixer<T | undefined, false> {
    return Optional(this);
  }

  /** Fixした結果に関数を適用*/
  map<U>(func: (value: T) => U): Fixer<U, FAILABLE> {
    return Map(this, func);
  }
}
