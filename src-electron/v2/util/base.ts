export class PanicError extends Error {}

export type Awaitable<T> = T | PromiseLike<T>;

export type Ok<T> = {
  readonly isOk: true;
  readonly isErr: false;
  value(): T;
  error(): never;
  onOk<U extends Result<any, any>>(op: (value: T) => U): U;
  onErr(op: (value: any) => Result<T, any>): Ok<T>;
  valueOrDefault(defaultValue: T): T;
  errorOrDefault<U>(defaultError: U): U;
};

export type Err<E> = {
  readonly isOk: false;
  readonly isErr: true;
  value(): never;
  error(): E;
  onOk(op: (error: any) => Result<any, E>): Err<E>;
  onErr<U extends Result<any, E>>(op: (error: E) => U): U;
  valueOrDefault<U>(defaultValue: U): U;
  errorOrDefault(defaultError: E): E;
};

export type Result<T, E = Error> = Ok<T> | Err<E>;

export type Value<T> = {
  isSome: true;
  isNone: false;
  onValue<U extends Opt<any>>(op: (some: T) => U): U;
  onNone(op: () => Opt<T>): Value<T>;
  valueOrDefault(defaultValue: T): T;
  value(): T;
  toResult(error: any): Ok<T>;
};

export type None = {
  isSome: false;
  isNone: true;
  onValue(op: (some: any) => Opt<any>): None;
  onNone<U extends Opt<any>>(op: () => U): U;
  valueOrDefault<T>(defaultValue: T): T;
  value(): never;
  toResult<E>(error: E): Err<E>;
};

export type Opt<T> = Value<T> | None;

const throwPanic = () => {
  throw new PanicError();
};

const identity = <T>(v: T): T => v;

export const ok = <T>(value: T): Ok<T> => {
  const returnValue = () => value;
  const result: Ok<T> = {
    isOk: true,
    isErr: false,
    value: returnValue,
    error: throwPanic,
    onOk: (op) => op(value),
    onErr: () => result,
    valueOrDefault: returnValue,
    errorOrDefault: identity,
  };
  return result;
};

export const err = <T>(error: T): Err<T> => {
  const returnError = () => error;
  const result: Err<T> = {
    isOk: false,
    isErr: true,
    value: throwPanic,
    error: returnError,
    onOk: () => result,
    onErr: (op) => op(error),
    valueOrDefault: identity,
    errorOrDefault: returnError,
  };
  return result;
};

export const value = <T>(value: T): Value<T> => {
  const returnValue = () => value;
  const result: Value<T> = {
    isSome: true,
    isNone: false,
    onValue: (op) => op(value),
    onNone: () => result,
    valueOrDefault: returnValue,
    value: returnValue,
    toResult: () => ok(value),
  };
  return result;
};

export const none: None = {
  isSome: false,
  isNone: true,
  onValue: () => none,
  onNone: (op) => op(),
  valueOrDefault: identity,
  value: throwPanic,
  toResult: err,
};

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('Result Test', async () => {
    function typeCheck(
      o: Ok<number>,
      e: Err<number>,
      r: Result<number, number>
    ) {
      expect(o.isOk).toBe(true);
      expect(e.isOk).toBe(false);
      expect(r.isOk).toEqual(expect.any(Boolean));

      expect(o.isErr).toBe(false);
      expect(e.isErr).toBe(true);
      expect(r.isErr).toEqual(expect.any(Boolean));

      expect(o.value()).toBe(2);
      expect(e.value).toThrow(PanicError);
      r.value;

      expect(o.error).toThrow(PanicError);
      expect(e.error()).toBe(3);
      r.error;

      expect(o.onOk((x) => ok(x * 2)).value()).toBe(4);
      expect(e.onOk((x) => ok(x * 2)).error()).toBe(3);
      r.onOk((x) => ok(x * 2));

      expect(o.valueOrDefault(5)).toBe(2);
      expect(e.valueOrDefault(5)).toBe(5);
      r.valueOrDefault(5);

      expect(o.errorOrDefault(5)).toBe(5);
      expect(e.errorOrDefault(5)).toBe(3);
      r.valueOrDefault(5);
    }
    const _ok: Result<number, number> = ok(2);
    const _err: Result<number, number> = err(3);

    typeCheck(_ok, _err, _err);
  });

  test('Opt Test', async () => {
    const _value: Opt<number> = value(2);
    const _none: Opt<number> = none;

    expect(_value.isSome).toBe(true);
    expect(_none.isSome).toBe(false);

    expect(_value.isNone).toBe(false);
    expect(_none.isNone).toBe(true);

    expect(_value.value()).toBe(2);
    expect(_none.value).toThrow(PanicError);

    expect(_value.onValue((x) => value(x * 2)).value()).toBe(4);
    expect(_none.onValue((x) => value(x * 2)).isNone).toBe(true);

    expect(_value.valueOrDefault(5)).toBe(2);
    expect(_none.valueOrDefault(5)).toBe(5);
  });
}
