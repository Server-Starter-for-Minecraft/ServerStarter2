import { Fixer, fail, isFail } from './fixer';

const object = global.Object;

export function fixObject<T extends object>(pattern: {
  [K in keyof T]: Fixer<T[K], false>;
}): Fixer<T, true>;
export function fixObject<T extends object>(pattern: {
  [K in keyof T]: Fixer<T[K], boolean>;
}): Fixer<T, true>;
export function fixObject<T extends object>(pattern: {
  [K in keyof T]: Fixer<T[K], boolean>;
}): Fixer<T, true> {
  const func = (value: any, path: string) => {
    if (typeof value !== 'object' || value instanceof Array || value === null) {
      return fail([path]);
    }

    const result: any = {};

    for (const [k, fixer] of object.entries<Fixer<any, boolean>>(pattern)) {
      const fixed = fixer.fix(value[k], path ? path + '.' + k : k);
      if (isFail(fixed)) return fixed;
      result[k] = fixed;
    }
    return result as T;
  };

  return new Fixer(func);
}
