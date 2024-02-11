import { Fixer, fail, isFail } from './fixer';

export function fixUnion<T extends any[]>(
  ...fixers: {
    [K in keyof T]: Fixer<T[K], false>;
  }
): Fixer<T[number], false>;
export function fixUnion<T extends any[]>(
  ...fixers: {
    [K in keyof T]: Fixer<T[K], true>;
  }
): Fixer<T[number], true>;
export function fixUnion<T extends any[]>(
  ...fixers: {
    [K in keyof T]: Fixer<T[K], boolean>;
  }
): Fixer<T[number], boolean> {
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
