import { Fixer, fail, isFail } from './fixer';

export function Union<T extends any[]>(
  ...fixers: {
    [K in keyof T]: Fixer<T[K], false>;
  }
): Fixer<T, false>;
export function Union<T extends any[]>(
  ...fixers: {
    [K in keyof T]: Fixer<T[K], true>;
  }
): Fixer<T, true>;
export function Union<T extends any[]>(
  ...fixers: {
    [K in keyof T]: Fixer<T[K], boolean>;
  }
): Fixer<T, boolean> {
  const func = (value: any, path: string) => {
    const fails: string[] = [];
    for (const fixer of fixers) {
      const fixed = fixer.fix(value, path);
      if (isFail(fixed)) {
        fails.push(...fixed.paths);
        continue;
      }
      return fixed;
    }
    return fail(fails);
  };

  return new Fixer(func);
}
