import { Fail, Fixer, isFail } from './fixer';

export function Map<T, U, F extends boolean>(
  fixer: Fixer<T, F>,
  func: (value: T) => U
): Fixer<U, F> {
  const f = (value: any, path: string) => {
    const fixed: T | Fail = fixer.func(value, path);
    return isFail(fixed) ? fixed : func(fixed);
  };

  return new Fixer<U, true>(f) as Fixer<U, F>;
}
