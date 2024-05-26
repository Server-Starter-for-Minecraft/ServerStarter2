export class PanicError extends Error {}

export type Awaitable<T> = T | PromiseLike<T>;

interface IResult<T, E> {
  isOk<T, E>(this: IResult<T, E>): this is Ok<T>;
  isErr<T, E>(this: IResult<T, E>): this is Err<E>;
  map<U>(op: (ok: T) => U): Result<U, E>;
  flatMap<U>(op: (ok: T) => Result<U, E>): Result<U, E>;
  valueOrDefault(defaultValue: T): T;
  errorOrDefault(defaultError: E): E;
  /**
   * Errの場合PanicErrorをなげるため使用には注意すること
   */
  get value(): T;
  /**
   * Okの場合PanicErrorをなげるため使用には注意すること
   */
  get error(): E;
  toOpt(): IOpt<T>;
}

export class Ok<T> implements IResult<T, any> {
  isOk<T, E>(this: IResult<T, E>): this is Ok<T> {
    return true;
  }
  isErr<T, E>(this: IResult<T, E>): this is Err<E> {
    return false;
  }
  map<U>(op: (ok: T) => U): Ok<U> {
    return new Ok(op(this._value));
  }
  flatMap<U, E>(op: (ok: T) => Result<U, E>): Result<U, E> {
    return op(this._value);
  }
  valueOrDefault(defaultValue: T): T {
    return this._value;
  }
  errorOrDefault<E>(defaultError: E): E {
    return defaultError;
  }
  get value(): T {
    return this._value;
  }
  get error(): never {
    throw new PanicError();
  }
  private _value: T;
  constructor(value: T) {
    this._value = value;
  }
  toOpt(): IOpt<T> {
    return new Value(this._value);
  }
}

export function ok<T>(value: T) {
  return new Ok(value);
}

export class Err<E> implements IResult<any, E> {
  isOk<T, E>(this: IResult<T, E>): this is Ok<T> {
    return false;
  }

  isErr<T, E>(this: IResult<T, E>): this is Err<E> {
    return true;
  }

  map<U>(): Err<E> {
    return this;
  }

  flatMap(): Err<E> {
    return this;
  }

  valueOrDefault<T>(defaultValue: T): T {
    return defaultValue;
  }
  errorOrDefault(defaultError: E): E {
    return this._value;
  }
  get value(): never {
    throw new PanicError();
  }
  get error(): E {
    return this._value;
  }
  private _value: E;
  constructor(value: E) {
    this._value = value;
  }
  toOpt<T>(): IOpt<T> {
    return new None();
  }
}

export function err<E = Error>(value: E) {
  return new Err(value);
}

export type Result<T, E = Error> = (Ok<T> | Err<E>) & {
  map<U>(op: (ok: T) => U): Result<U, E>;
  flatMap<U>(op: (ok: T) => Result<U, E>): Result<U, E>;
};

/**
 * 与えた関数内部で起こったエラーを Resultとしてラップして返す
 * @param func throwする可能性のある関数
 * @returns throwをErrでラップした関数
 */
export const catchToResult =
  <A extends any[], T>(
    func: (...args: A) => Result<T>
  ): ((...args: A) => Result<T>) =>
  (...args: A) => {
    try {
      return func(...args);
    } catch (e) {
      if (e instanceof PanicError) return err(e);
      throw e;
    }
  };

/**
 * 与えた非同期関数内部で起こったPAnicErrorを Resultとしてラップして返す
 *
 * haskellのdoみたいな使い方を想定
 *
 * @param func throwする可能性のある非同期関数
 * @returns throwをErrでラップした非同期関数
 */
export const catchToResultAsync =
  <A extends any[], T>(
    func: (...args: A) => Promise<Result<T>>
  ): ((...args: A) => Promise<Result<T>>) =>
  async (...args: A) => {
    try {
      return await func(...args);
    } catch (e) {
      if (e instanceof PanicError) return err(e);
      throw e;
    }
  };

interface IOpt<T> {
  isSome<T>(this: IOpt<T>): this is Value<T>;
  isNone<T>(this: IOpt<T>): this is None;
  map<U>(op: (some: T) => U): IOpt<U>;
  valueOrDefault(defaultValue: T): T;
  get value(): T;
  toResult<E>(error: E): IResult<T, E>;
}

export class Value<T> implements IOpt<T> {
  private _value: T;

  constructor(value: T) {
    this._value = value;
  }
  isSome<T>(this: IOpt<T>): this is Value<T> {
    return true;
  }
  isNone<T>(this: IOpt<T>): this is None {
    return false;
  }
  map<U>(op: (some: T) => U): Value<U> {
    return new Value(op(this.value));
  }
  valueOrDefault(defaultValue: T): T {
    return this._value;
  }
  get value(): T {
    return this._value;
  }
  toResult<E>(error: E): IResult<T, E> {
    return new Ok(this._value);
  }
}

export function value<T>(value: T) {
  return new Value(value);
}

export class None implements IOpt<any> {
  private static instance?: None;

  constructor() {
    // シングルトンのための処理
    return None.instance ?? (None.instance = this);
  }
  isSome<T>(this: IOpt<T>): this is Value<T> {
    return false;
  }
  isNone<T>(this: IOpt<T>): this is None {
    return true;
  }
  unwrap(): never {
    throw new PanicError();
  }
  map<U>(op: (some: any) => U): None {
    return this;
  }
  valueOrDefault<T>(defaultValue: T): T {
    return defaultValue;
  }
  get value(): never {
    throw new PanicError();
  }
  toResult<T, E>(error: E): IResult<T, E> {
    return new Err(error);
  }
}

export const none = new None();

export type Opt<T> = (Value<T> | None) & {
  map<U>(op: (ok: T) => U): Opt<U>;
};

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('Result Test', async () => {
    const ok: Result<number, number> = new Ok(2);
    const err: Result<number, number> = new Err(3);

    expect(ok.isOk()).toBe(true);
    expect(err.isOk()).toBe(false);

    expect(ok.isErr()).toBe(false);
    expect(err.isErr()).toBe(true);

    expect(ok.value).toBe(2);
    expect(() => err.value).toThrow(PanicError);

    expect(() => ok.error).toThrow(PanicError);
    expect(err.error).toBe(3);

    expect(ok.map((x) => x * 2).value).toBe(4);
    expect(err.map((x) => x * 2).error).toBe(3);

    expect(ok.valueOrDefault(5)).toBe(2);
    expect(err.valueOrDefault(5)).toBe(5);

    expect(ok.errorOrDefault(5)).toBe(5);
    expect(err.errorOrDefault(5)).toBe(3);
  });

  test('Opt Test', async () => {
    const value: Opt<number> = new Value(2);
    const none: Opt<number> = new None();

    expect(value.isSome()).toBe(true);
    expect(none.isSome()).toBe(false);

    expect(value.isNone()).toBe(false);
    expect(none.isNone()).toBe(true);

    expect(value.value).toBe(2);
    expect(() => none.value).toThrow(PanicError);

    expect(value.map((x) => x * 2).value).toBe(4);
    expect(none.map((x) => x * 2).isNone()).toBe(true);

    expect(value.valueOrDefault(5)).toBe(2);
    expect(none.valueOrDefault(5)).toBe(5);
  });
}
