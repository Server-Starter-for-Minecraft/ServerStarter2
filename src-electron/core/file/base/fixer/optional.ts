import { Fail, Fixer, isFail } from './fixer';

export function fixOptional<T>(
  fixer: Fixer<T, boolean>
): Fixer<T | undefined, false> {
  const func = (value: any, path: string) => {
    const fixed: T | Fail = fixer.fix(value, path);
    return isFail(fixed) ? undefined : fixed;
  };
  return new Fixer<T | undefined, false>(func);
}
