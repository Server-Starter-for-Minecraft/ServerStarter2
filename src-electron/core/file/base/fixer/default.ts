import { Fail, Fixer, isFail } from './fixer';

export function fixDefault<T>(
  fixer: Fixer<T, boolean>,
  dafult: T
): Fixer<T, false> {
  const func = (value: any, path: string) => {
    const fixed: T | Fail = fixer.fix(value, path);
    return isFail(fixed) ? dafult : fixed;
  };
  return new Fixer<T, false>(func);
}
