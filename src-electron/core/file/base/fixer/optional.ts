import { Fail, Fixer, isFail } from './fixer';

export function Optional<T>(
  fixer: Fixer<T, boolean>
): Fixer<T | undefined, false> {
  const func = (value: any, path: string) => {
    const fixed: T | Fail = fixer.func(value, path);
    return isFail(fixed) ? undefined : fixed;
  };
  return new Fixer<T | undefined, false>(func);
}
