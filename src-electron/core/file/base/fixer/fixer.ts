import { fixDefault } from './default';
import { fixMap } from './map';
import { fixOptional } from './optional';
import { fixUnion } from './union';

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

type And<X extends boolean, Y extends boolean> = X extends true
  ? Y extends true
    ? true
    : false
  : false;
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
    return fixDefault(this, dafult);
  }

  /** Fixに失敗した際にFailではなくデフォルト値を使用 */
  optional(): Fixer<T | undefined, false> {
    return fixOptional(this);
  }

  /** Fixした結果に関数を適用*/
  map<U>(func: (value: T) => U): Fixer<U, FAILABLE> {
    return fixMap(this, func);
  }

  or<U, F extends boolean>(
    fallback: Fixer<U, F>
  ): Fixer<T | U, And<FAILABLE, F>> {
    return fixUnion<[T, U]>(
      this as Fixer<T, true>,
      fallback as Fixer<U, true>
    ) as Fixer<T | U, And<FAILABLE, F>>;
  }
}
