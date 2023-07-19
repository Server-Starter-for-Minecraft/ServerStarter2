export type Fixer<T> = (arg: any) => T;

export type primitive = number | string | boolean | null;

export const FAIL = Symbol();
export type FAIL = typeof FAIL;

export function literalFixer<T extends primitive>(
  values: readonly T[]
): Fixer<T | FAIL>;
export function literalFixer<T extends primitive>(
  values: readonly T[],
  defaultValue: T
): Fixer<T>;
export function literalFixer<T extends primitive>(
  values: readonly T[],
  defaultValue?: T
): Fixer<T> {
  return (arg: any) =>
    values.includes(arg)
      ? arg
      : defaultValue !== undefined
      ? defaultValue
      : FAIL;
}

export function stringFixer<T extends string = string>(): Fixer<T | FAIL>;
export function stringFixer<T extends string = string>(
  defaultValue: T
): Fixer<T>;
export function stringFixer<T extends string = string>(
  defaultValue?: T
): Fixer<T | FAIL> {
  return ((arg: any) => {
    if (typeof arg === 'string') return arg;
    return defaultValue ?? FAIL;
  }) as Fixer<T | FAIL>;
}

export function regexFixer<T extends string = string>(
  pattern: RegExp
): Fixer<T | FAIL>;
export function regexFixer<T extends string = string>(
  pattern: RegExp,
  defaultValue: T
): Fixer<T>;
export function regexFixer<T extends string = string>(
  pattern: RegExp,
  defaultValue?: T
): Fixer<T | FAIL> {
  return ((arg: any) => {
    if (typeof arg === 'string' && arg.match(pattern)) return arg;
    return defaultValue ?? FAIL;
  }) as Fixer<T | FAIL>;
}

export function numberFixer<T extends number = number>(): Fixer<T | FAIL>;
export function numberFixer<T extends number = number>(
  defaultValue: T
): Fixer<T>;
export function numberFixer<T extends number = number>(
  defaultValue?: T
): Fixer<T | FAIL> {
  return ((arg: any) => {
    if (typeof arg === 'number') return arg;
    return defaultValue ?? FAIL;
  }) as Fixer<T | FAIL>;
}

export function booleanFixer<T extends boolean = boolean>(): Fixer<T | FAIL>;
export function booleanFixer<T extends boolean = boolean>(
  defaultValue: T
): Fixer<T>;
export function booleanFixer<T extends boolean = boolean>(
  defaultValue?: T
): Fixer<T | FAIL> {
  return ((arg: any) => {
    if (typeof arg === 'boolean') return arg;
    return defaultValue ?? FAIL;
  }) as Fixer<T | FAIL>;
}

export function nullFixer<T extends null = null>(): Fixer<T | FAIL>;
export function nullFixer<T extends null = null>(defaultValue: T): Fixer<T>;
export function nullFixer<T extends null = null>(
  defaultValue?: T
): Fixer<T | FAIL> {
  return ((arg: any) => {
    if (defaultValue === null || arg === null) return null;
    return FAIL;
  }) as Fixer<T | FAIL>;
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

export function defaultFixer<T>(
  fixer: Fixer<T | FAIL>,
  defaultValue: T
): Fixer<T> {
  return (arg: any) => {
    const r = fixer(arg);
    return r === FAIL ? defaultValue : r;
  };
}

export function applyFixer<T, U>(
  fixer: Fixer<T>,
  apply: (arg: T) => U
): Fixer<U>;
export function applyFixer<T, U>(
  fixer: Fixer<T | FAIL>,
  apply: (arg: T) => U | FAIL
): Fixer<U | FAIL>;
export function applyFixer<T, U>(
  fixer: Fixer<T | FAIL>,
  apply: (arg: T) => U | FAIL
): Fixer<U | FAIL> {
  return (arg: any) => {
    const r = fixer(arg);
    return r === FAIL ? FAIL : apply(r);
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

export function mergeFixer<A extends object, B extends object>(
  a: Fixer<A>,
  b: Fixer<B>
): Fixer<A & B>;
export function mergeFixer<A extends object, B extends object>(
  a: Fixer<A | FAIL>,
  b: Fixer<B | FAIL>
): Fixer<(A & B) | FAIL>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object
>(a: Fixer<A>, b: Fixer<B>, c: Fixer<C>): Fixer<A & B & C>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object
>(
  a: Fixer<A | FAIL>,
  b: Fixer<B | FAIL>,
  c: Fixer<C | FAIL>
): Fixer<(A & B & C) | FAIL>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object,
  D extends object
>(a: Fixer<A>, b: Fixer<B>, c: Fixer<C>, d: Fixer<D>): Fixer<A & B & C & D>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object,
  D extends object
>(
  a: Fixer<A | FAIL>,
  b: Fixer<B | FAIL>,
  c: Fixer<C | FAIL>,
  d: Fixer<D | FAIL>
): Fixer<(A & B & C & D) | FAIL>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object,
  D extends object,
  E extends object
>(
  a: Fixer<A>,
  b: Fixer<B>,
  c: Fixer<C>,
  d: Fixer<D>,
  e: Fixer<E>
): Fixer<A & B & C & D & E>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object,
  D extends object,
  E extends object
>(
  a: Fixer<A | FAIL>,
  b: Fixer<B | FAIL>,
  c: Fixer<C | FAIL>,
  d: Fixer<D | FAIL>,
  e: Fixer<E | FAIL>
): Fixer<(A & B & C & D & E) | FAIL>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object,
  D extends object,
  E extends object,
  F extends object
>(
  a: Fixer<A>,
  b: Fixer<B>,
  c: Fixer<C>,
  d: Fixer<D>,
  e: Fixer<E>,
  f: Fixer<F>
): Fixer<A & B & C & D & E & F>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object,
  D extends object,
  E extends object,
  F extends object
>(
  a: Fixer<A | FAIL>,
  b: Fixer<B | FAIL>,
  c: Fixer<C | FAIL>,
  d: Fixer<D | FAIL>,
  e: Fixer<E | FAIL>,
  f: Fixer<F | FAIL>
): Fixer<(A & B & C & D & E & F) | FAIL>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object,
  D extends object,
  E extends object,
  F extends object,
  G extends object
>(
  a: Fixer<A>,
  b: Fixer<B>,
  c: Fixer<C>,
  d: Fixer<D>,
  e: Fixer<E>,
  f: Fixer<F>,
  g: Fixer<G>
): Fixer<A & B & C & D & E & F & G>;
export function mergeFixer<
  A extends object,
  B extends object,
  C extends object,
  D extends object,
  E extends object,
  F extends object,
  G extends object
>(
  a: Fixer<A | FAIL>,
  b: Fixer<B | FAIL>,
  c: Fixer<C | FAIL>,
  d: Fixer<D | FAIL>,
  e: Fixer<E | FAIL>,
  f: Fixer<F | FAIL>,
  g: Fixer<G | FAIL>
): Fixer<(A & B & C & D & E & F & G) | FAIL>;
export function mergeFixer(...fixers: Fixer<object | FAIL>[]): Fixer<any> {
  let result = {};
  return (arg: any) => {
    for (const fixer of fixers) {
      const r = fixer(arg);
      if (r === FAIL) return FAIL;
      result = { ...result, ...r };
    }
    return result;
  };
}

export function extendFixer<T, B extends Partial<T>>(
  base: Fixer<B>,
  pattern: {
    [K in keyof (Omit<T, keyof B> & Partial<T>)]: Fixer<T[K]>;
  },
  fixNonObject: true
): Fixer<T>;
export function extendFixer<T, B extends Partial<T>>(
  base: Fixer<B | FAIL>,
  pattern: {
    [K in keyof (Omit<T, keyof B> & Partial<T>)]: Fixer<T[K] | FAIL>;
  },
  fixNonObject: boolean
): Fixer<T | FAIL>;
export function extendFixer<T, B extends Partial<T>>(
  base: Fixer<B | FAIL>,
  pattern: {
    [K in keyof (Omit<T, keyof B> & Partial<T>)]: Fixer<T[K] | FAIL>;
  },
  fixNonObject: boolean
): Fixer<T | FAIL> {
  return mergeFixer<B, Omit<T, keyof B> & Partial<T>>(
    base,
    objectFixer<Omit<T, keyof B> & Partial<T>>(pattern, fixNonObject)
  ) as Fixer<T | FAIL>;
}
