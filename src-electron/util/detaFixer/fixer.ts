export type Fixer<T> = (arg: any) => T;

export type primitive = number | string | boolean | null;

export const FAIL = Symbol();
export type FAIL = typeof FAIL;

export function literalFixer<T extends primitive>(values: T[]): Fixer<T | FAIL>;
export function literalFixer<T extends primitive>(
  values: T[],
  defaultValue: T
): Fixer<T>;
export function literalFixer<T extends primitive>(
  values: T[],
  defaultValue?: T
): Fixer<T> {
  return (arg: any) =>
    values.includes(arg)
      ? arg
      : defaultValue !== undefined
      ? defaultValue
      : FAIL;
}

export function stringFixer(): Fixer<string | FAIL>;
export function stringFixer(defaultValue: string): Fixer<string>;
export function stringFixer(defaultValue?: string): Fixer<string | FAIL> {
  return ((arg: any) => {
    if (typeof arg === 'string') return arg;
    return defaultValue ?? FAIL;
  }) as Fixer<string | FAIL>;
}

export function numberFixer(): Fixer<number | FAIL>;
export function numberFixer(defaultValue: number): Fixer<number>;
export function numberFixer(defaultValue?: number): Fixer<number | FAIL> {
  return ((arg: any) => {
    if (typeof arg === 'number') return arg;
    return defaultValue ?? FAIL;
  }) as Fixer<number | FAIL>;
}

export function booleanFixer(): Fixer<boolean | FAIL>;
export function booleanFixer(defaultValue: boolean): Fixer<boolean>;
export function booleanFixer(defaultValue?: boolean): Fixer<boolean | FAIL> {
  return ((arg: any) => {
    if (typeof arg === 'boolean') return arg;
    return defaultValue ?? FAIL;
  }) as Fixer<boolean | FAIL>;
}

export function nullFixer(): Fixer<null | FAIL>;
export function nullFixer(defaultValue: null): Fixer<null>;
export function nullFixer(defaultValue?: null): Fixer<null | FAIL> {
  return ((arg: any) => {
    if (defaultValue === null || arg === null) return null;
    return FAIL;
  }) as Fixer<null | FAIL>;
}

export function objectFixer<T extends object>(
  pattern: {
    [K in keyof T]: Fixer<T[K]>;
  },
  fixNonObject: true
): Fixer<T>;
export function objectFixer<T extends object>(
  pattern: {
    [K in keyof T]: Fixer<T[K] | FAIL>;
  },
  fixNonObject: boolean
): Fixer<T | FAIL>;
export function objectFixer<T extends object>(
  pattern: {
    [K in keyof T]: Fixer<T[K] | FAIL>;
  },
  fixNonObject: boolean
): Fixer<T | FAIL> {
  function result(arg: any) {
    if (typeof arg !== 'object' || arg instanceof Array || arg === null) {
      if (fixNonObject) arg = {};
      else return FAIL;
    }
    const result: Record<string, any> = {};
    for (const [k, fixer] of Object.entries<Fixer<any>>(pattern)) {
      const fixed = fixer(arg[k]);
      if (fixed === FAIL) return FAIL;
      result[k] = fixed;
    }
    return result as T;
  }
  return result;
}

export function recordFixer<K extends string, T>(
  valueFixer: Fixer<T | FAIL>,
  fixNonObject: true
): Fixer<Record<K, T>>;
export function recordFixer<K extends string, T>(
  valueFixer: Fixer<T | FAIL>,
  fixNonObject: boolean
): Fixer<Record<K, T> | FAIL>;
export function recordFixer<K extends string, T>(
  valueFixer: Fixer<T | FAIL>,
  fixNonObject: boolean
): Fixer<Record<K, T> | FAIL> {
  function result(arg: any) {
    if (typeof arg !== 'object' || arg instanceof Array || arg === null) {
      if (fixNonObject) arg = {};
      else return FAIL;
    }
    const entries = Object.entries(arg)
      .map(([k, v]) => [k, valueFixer(v)])
      .filter(([, v]) => v !== FAIL);
    return Object.fromEntries(entries);
  }
  return result;
}

export function arrayFixer<T>(
  childFixer: Fixer<T | FAIL>,
  fixNonArray: true
): Fixer<T[]>;
export function arrayFixer<T>(
  childFixer: Fixer<T | FAIL>,
  fixNonArray: false
): Fixer<T[] | FAIL>;
export function arrayFixer<T>(
  childFixer: Fixer<T>,
  fixNonArray: boolean
): Fixer<T[] | FAIL> {
  function result(arg: any) {
    if (!(arg instanceof Array)) return fixNonArray ? [] : FAIL;
    return arg.map(childFixer).filter((x) => x !== FAIL);
  }
  return result as Fixer<T[] | FAIL>;
}

export function optionalFixer<T>(fixer: Fixer<T | FAIL>): Fixer<T | undefined> {
  return (arg: any) => {
    const r = fixer(arg);
    return r === FAIL ? undefined : r;
  };
}

export function unionFixer<A, B>(
  a: Fixer<A>,
  b: Fixer<B>
): Fixer<Exclude<A, FAIL> | B>;
export function unionFixer<A, B, C>(
  a: Fixer<A>,
  b: Fixer<B>,
  c: Fixer<C>
): Fixer<Exclude<A | B, FAIL> | C>;
export function unionFixer<A, B, C, D>(
  a: Fixer<A>,
  b: Fixer<B>,
  c: Fixer<C>,
  d: Fixer<D>
): Fixer<Exclude<A | B | C, FAIL> | D>;
export function unionFixer<A, B, C, D, E>(
  a: Fixer<A>,
  b: Fixer<B>,
  c: Fixer<C>,
  d: Fixer<D>,
  e: Fixer<E>
): Fixer<Exclude<A | B | C | D, FAIL> | E>;
export function unionFixer<A, B, C, D, E, F>(
  a: Fixer<A>,
  b: Fixer<B>,
  c: Fixer<C>,
  d: Fixer<D>,
  e: Fixer<E>,
  f: Fixer<F>
): Fixer<Exclude<A | B | C | D | E, FAIL> | F>;
export function unionFixer<A, B, C, D, E, F, G>(
  a: Fixer<A>,
  b: Fixer<B>,
  c: Fixer<C>,
  d: Fixer<D>,
  e: Fixer<E>,
  f: Fixer<F>,
  g: Fixer<G>
): Fixer<Exclude<A | B | C | D | E | F, FAIL> | G>;
export function unionFixer(...fixers: Fixer<any>[]): Fixer<any> {
  return (arg: any) => {
    for (const fixer of fixers) {
      const reslut = fixer(arg);
      if (reslut !== FAIL) return reslut;
    }
    return FAIL;
  };
}
