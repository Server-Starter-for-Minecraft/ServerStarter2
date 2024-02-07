import { Fail, Fixer, isFail } from './fixer';

/** fixに成功した場合にその内容を変換する */
export function fixMap<T, U, F extends boolean>(
  fixer: Fixer<T, F>,
  func: (value: T) => U
): Fixer<U, F>;
export function fixMap<T, U, F extends boolean>(
  fixer: Fixer<T, F>,
  func: (value: T) => U | Fail
): Fixer<U, true>;
export function fixMap<T, U, F extends boolean>(
  fixer: Fixer<T, F>,
  func: (value: T) => U | Fail
): Fixer<U, boolean> {
  const f = (value: any, path: string) => {
    const fixed: T | Fail = fixer.fix(value, path);
    return isFail(fixed) ? fixed : func(fixed);
  };

  return new Fixer<U, true>(f) as Fixer<U, F>;
}
