export class PanicError extends Error {}

export type Awaitable<T> = T | PromiseLike<T>;

export interface Result<T, E> {
  isOk<T, E>(this: Result<T, E>): this is Ok<T>;
  isErr<T, E>(this: Result<T, E>): this is Ok<T>;
  expect(message: string): T;
  unwrap(): T;
  unwrapOr(defaultValue: T): T;
  unwrapOrElse(op: (err: E) => T): T;
  unwrapOrElseAsync(op: (err: E) => Awaitable<T>): Promise<T>;
  expectErr(message: string): E;
  unwrapErr(): E;
  map<U>(op: (ok: T) => U): Result<U, E>;
  mapAsync<U>(op: (ok: T) => Awaitable<U>): Promise<Result<U, E>>;
  mapErr<F>(op: (err: E) => F): Result<T, F>;
  mapErrAsync<F>(op: (err: E) => Awaitable<F>): Promise<Result<T, F>>;
  mapOr<U>(defaultValue: U, op: (ok: T) => U): U;
  mapOrAsync<U>(defaultValue: U, op: (ok: T) => Awaitable<U>): Promise<U>;
  mapOrElse<U>(fErr: (err: E) => U, fOk: (ok: T) => U): U;
  mapOrElseAsync<U>(
    fErr: (err: E) => Awaitable<U>,
    fOk: (ok: T) => Awaitable<U>
  ): Promise<U>;
}

export class Ok<T> implements Result<T, any> {
  isOk<T, E>(this: Result<T, E>): this is Ok<T> {
    return true;
  }
  isErr<T, E>(this: Result<T, E>): this is Ok<T> {
    return false;
  }
  async unwrapOrElseAsync(op: (err: any) => Awaitable<T>): Promise<T> {
    return this.value;
  }
  async mapAsync<U>(op: (ok: T) => Awaitable<U>): Promise<Result<U, any>> {
    return new Ok(await op(this.value));
  }
  async mapErrAsync<F>(op: (err: any) => Awaitable<F>): Promise<Result<T, F>> {
    return this;
  }
  async mapOrAsync<U>(
    defaultValue: U,
    op: (ok: T) => Awaitable<U>
  ): Promise<U> {
    return op(this.value);
  }
  async mapOrElseAsync<U>(
    fErr: (err: any) => Awaitable<U>,
    fOk: (ok: T) => Awaitable<U>
  ): Promise<U> {
    return fOk(this.value);
  }
  map<U, E>(op: (ok: T) => U): Result<U, E> {
    return new Ok(op(this.value));
  }
  mapErr<F>(op: (err: any) => F): Result<T, F> {
    return this;
  }
  mapOr<U, E>(defaultValue: U, op: (ok: T) => U): U {
    return op(this.value);
  }
  mapOrElse<U, E>(fErr: (err: E) => U, fOk: (ok: T) => U): U {
    return fOk(this.value);
  }
  expect(message: string): T {
    return this.value;
  }
  unwrap(): T {
    return this.value;
  }
  unwrapOr(defaultValue: T): T {
    return this.value;
  }
  unwrapOrElse(op: (err: any) => T): T {
    return this.value;
  }
  expectErr<E>(message: string): E {
    throw new PanicError(message);
  }
  unwrapErr<E>(): E {
    throw new PanicError();
  }
  private value: T;
  constructor(value: T) {
    this.value = value;
  }
}

export class Err<E> implements Result<any, E> {
  isOk<T, E>(this: Result<T, E>): this is Ok<T> {
    return false;
  }
  isErr<T, E>(this: Result<T, E>): this is Ok<T> {
    return true;
  }
  unwrapOrElseAsync(op: (err: E) => any): Promise<any> {
    return op(this.value);
  }
  async mapAsync<U>(op: (ok: any) => Awaitable<U>): Promise<Result<U, E>> {
    return this;
  }
  async mapErrAsync<F>(op: (err: E) => Awaitable<F>): Promise<Result<any, F>> {
    return new Err(await op(this.value));
  }
  async mapOrAsync<U>(
    defaultValue: U,
    op: (ok: any) => Awaitable<U>
  ): Promise<U> {
    return defaultValue;
  }
  async mapOrElseAsync<U>(
    fErr: (err: E) => Awaitable<U>,
    fOk: (ok: any) => Awaitable<U>
  ): Promise<U> {
    return fErr(this.value);
  }
  map<U>(op: (ok: any) => U): Result<U, E> {
    return this;
  }
  mapErr<T, F>(op: (err: E) => F): Result<T, F> {
    return new Err(op(this.value));
  }
  mapOr<U>(defaultValue: U, op: (ok: any) => U): U {
    return defaultValue;
  }
  mapOrElse<U>(fErr: (err: E) => U, fOk: (ok: any) => U): U {
    return fErr(this.value);
  }
  expect<T>(message: string): T {
    throw new PanicError(message);
  }
  unwrap<T>(): T {
    throw new PanicError();
  }
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }
  unwrapOrElse<T>(op: (err: any) => T): T {
    return op(this.value);
  }
  expectErr(message: string): E {
    return this.value;
  }
  unwrapErr(): E {
    return this.value;
  }
  private value: E;
  constructor(value: E) {
    this.value = value;
  }
}

export interface Opt<T> {
  isSome<T>(this: Opt<T>): this is Some<T>;
  isNone<T>(this: Opt<T>): this is None;
  and<U>(optb: Opt<U>): Opt<U>;
  andThen<U>(f: (some: T) => Opt<U>): Opt<U>;
  andThenAsync<U>(f: (some: T) => Awaitable<Opt<U>>): Promise<Opt<U>>;
  or(optb: Opt<T>): Opt<T>;
  orElse(f: () => Opt<T>): Opt<T>;
  orElseAsync(f: () => Awaitable<Opt<T>>): Promise<Opt<T>>;
  xor(optb: Opt<T>): Opt<T>;
  zip<L extends any[]>(...other: { [K in keyof L]: Opt<L[K]> }): Opt<[T, ...L]>;
  unzip<L extends any[]>(
    this: Opt<[...L]>,
    length: L['length']
  ): { [K in keyof L]: Opt<L[K]> };
  expect(message: string): T;
  unwrap(): T;
  unwrapOr(defaultValue: T): T;
  unwrapOrElse(f: () => T): T;
  unwrapOrElseAsync(f: () => Awaitable<T>): Promise<T>;
  map<U>(op: (some: T) => U): Opt<U>;
  mapAsync<U>(op: (some: T) => Awaitable<U>): Promise<Opt<U>>;
  mapOr<U>(defaultValue: U, f: (some: T) => U): U;
  mapOrAsync<U>(
    defaultValue: Awaitable<U>,
    f: (some: T) => Awaitable<U>
  ): Promise<U>;
  mapOrElse<U>(d: () => U, f: (some: T) => U): U;
  mapOrElseAsync<U>(
    d: () => Awaitable<U>,
    f: (some: T) => Awaitable<U>
  ): Promise<U>;
  okOr<E>(err: E): Result<T, E>;
  okOrElse<E>(err: () => E): Result<T, E>;
  okOrElseAsync<E>(err: () => Awaitable<E>): Promise<Result<T, E>>;
  filter(predicate: (some: T) => boolean): Opt<T>;
  filterAsync(predicate: (some: T) => Awaitable<boolean>): Promise<Opt<T>>;
}

export class Some<T> implements Opt<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }
  isSome<T>(this: Opt<T>): this is Some<T> {
    return true;
  }
  isNone<T>(this: Opt<T>): this is None {
    return false;
  }
  and<U>(optb: Opt<U>): Opt<U> {
    return optb;
  }
  andThen<U>(f: (some: T) => Opt<U>): Opt<U> {
    return f(this.value);
  }
  async andThenAsync<U>(f: (some: T) => Awaitable<Opt<U>>): Promise<Opt<U>> {
    return await f(this.value);
  }
  or(optb: Opt<T>): Opt<T> {
    return this;
  }
  orElse(f: () => Opt<T>): Opt<T> {
    return this;
  }
  async orElseAsync(f: () => Awaitable<Opt<T>>): Promise<Opt<T>> {
    return this;
  }
  xor(optb: Opt<T>): Opt<T> {
    return optb.isSome() ? new None() : this;
  }
  zip<L extends any[]>(
    ...other: { [K in keyof L]: Opt<L[K]> }
  ): Opt<[T, ...L]> {
    const l = [this, ...other];
    if (l.every((x) => x.isSome())) {
      return new Some(l.map((x) => x.unwrap())) as unknown as Opt<[T, ...L]>;
    } else {
      return new None();
    }
  }
  unzip<L extends any[]>(
    this: Opt<[...L]>,
    length: L['length']
  ): { [K in keyof L]: Opt<L[K]> } {
    return this.unwrap().map((x) => new Some(x)) as {
      [K in keyof L]: Opt<L[K]>;
    };
  }
  expect(message: string): T {
    return this.value;
  }
  unwrap(): T {
    return this.value;
  }
  unwrapOr(defaultValue: T): T {
    return this.value;
  }
  unwrapOrElse(f: () => T): T {
    return this.value;
  }
  async unwrapOrElseAsync(f: () => Awaitable<T>): Promise<T> {
    return this.value;
  }
  map<U>(op: (some: T) => U): Opt<U> {
    return new Some(op(this.value));
  }
  async mapAsync<U>(op: (some: T) => Awaitable<U>): Promise<Opt<U>> {
    return new Some(await op(this.value));
  }
  mapOr<U>(defaultValue: U, f: (some: T) => U): U {
    return f(this.value);
  }
  async mapOrAsync<U>(
    defaultValue: Awaitable<U>,
    f: (some: T) => Awaitable<U>
  ): Promise<U> {
    return f(this.value);
  }
  mapOrElse<U>(d: () => U, f: (some: T) => U): U {
    return f(this.value);
  }
  async mapOrElseAsync<U>(
    d: () => Awaitable<U>,
    f: (some: T) => Awaitable<U>
  ): Promise<U> {
    return f(this.value);
  }
  okOr<E>(err: E): Result<T, E> {
    return new Ok(this.value);
  }
  okOrElse<E>(err: () => E): Result<T, E> {
    return new Ok(this.value);
  }
  async okOrElseAsync<E>(err: () => Awaitable<E>): Promise<Result<T, E>> {
    return new Ok(this.value);
  }
  filter(predicate: (some: T) => boolean): Opt<T> {
    return predicate(this.value) ? this : new None();
  }
  async filterAsync(
    predicate: (some: T) => Awaitable<boolean>
  ): Promise<Opt<T>> {
    return (await predicate(this.value)) ? this : new None();
  }
}

export class None implements Opt<any> {
  private static instance?: None;

  constructor() {
    // シングルトンのための処理
    return None.instance ?? (None.instance = this);
  }
  isSome<T>(this: Opt<T>): this is Some<T> {
    return false;
  }
  isNone<T>(this: Opt<T>): this is None {
    return true;
  }
  and<U>(optb: Opt<U>): Opt<U> {
    return this;
  }
  andThen<U>(f: (some: any) => Opt<U>): Opt<U> {
    return this;
  }
  async andThenAsync<U>(f: (some: any) => Awaitable<Opt<U>>): Promise<Opt<U>> {
    return this;
  }
  or<T>(optb: Opt<T>): Opt<T> {
    return optb;
  }
  orElse<T>(f: () => Opt<T>): Opt<T> {
    return f();
  }
  async orElseAsync<T>(f: () => Awaitable<Opt<T>>): Promise<Opt<T>> {
    return f();
  }
  xor<T>(optb: Opt<T>): Opt<T> {
    return optb;
  }
  zip<T, L extends any[]>(
    ...other: { [K in keyof L]: Opt<L[K]> }
  ): Opt<[T, ...L]> {
    return new None();
  }
  unzip<L extends any[]>(
    this: Opt<[...L]>,
    length: L['length']
  ): { [K in keyof L]: Opt<L[K]> } {
    return new Array(length).fill(new None()) as { [K in keyof L]: Opt<L[K]> };
  }
  expect(message: string): never {
    throw new PanicError(message);
  }
  unwrap(): never {
    throw new PanicError();
  }
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }
  unwrapOrElse<T>(f: () => T): T {
    return f();
  }
  async unwrapOrElseAsync<T>(f: () => Awaitable<T>): Promise<T> {
    return await f();
  }
  map<U>(op: (some: any) => U): Opt<U> {
    return this;
  }
  async mapAsync<U>(op: (some: any) => Awaitable<U>): Promise<Opt<U>> {
    return this;
  }
  mapOr<U>(defaultValue: U, f: (some: any) => U): U {
    return defaultValue;
  }
  async mapOrAsync<U>(
    defaultValue: Awaitable<U>,
    f: (some: any) => Awaitable<U>
  ): Promise<U> {
    return defaultValue;
  }
  mapOrElse<U>(d: () => U, f: (some: any) => U): U {
    return d();
  }
  async mapOrElseAsync<U>(
    d: () => Awaitable<U>,
    f: (some: any) => Awaitable<U>
  ): Promise<U> {
    return d();
  }
  okOr<E>(err: E): Result<any, E> {
    return new Err(err);
  }
  okOrElse<E>(err: () => E): Result<any, E> {
    return new Err(err());
  }
  async okOrElseAsync<E>(err: () => Awaitable<E>): Promise<Result<any, E>> {
    return new Err(await err());
  }
  filter(predicate: (some: any) => boolean): Opt<any> {
    return this;
  }
  async filterAsync(
    predicate: (some: any) => Awaitable<boolean>
  ): Promise<Opt<any>> {
    return this;
  }
}

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

    expect(ok.unwrap()).toBe(2);
    expect(() => err.unwrap()).toThrow();

    expect(() => ok.unwrapErr()).toThrow();
    expect(err.unwrapErr()).toBe(3);

    expect(ok.expect('expect')).toBe(2);
    expect(() => err.expect('expect')).toThrow('expect');

    expect(() => ok.expectErr('expect')).toThrow('expect');
    expect(err.expectErr('expect')).toBe(3);

    expect(ok.map((x) => x * 2).unwrap()).toBe(4);
    expect(err.map((x) => x * 2).unwrapErr()).toBe(3);

    await expect(
      ok.mapAsync((x) => x * 2).then((x) => x.unwrap())
    ).resolves.toBe(4);
    await expect(
      err.mapAsync((x) => x * 2).then((x) => x.unwrapErr())
    ).resolves.toBe(3);

    expect(ok.mapErr((x) => x * 2).unwrap()).toBe(2);
    expect(err.mapErr((x) => x * 2).unwrapErr()).toBe(6);

    await expect(
      ok.mapErrAsync((x) => x * 2).then((x) => x.unwrap())
    ).resolves.toBe(2);
    await expect(
      err.mapErrAsync((x) => x * 2).then((x) => x.unwrapErr())
    ).resolves.toBe(6);

    expect(ok.mapOr(false, (value) => true)).toBe(true);
    expect(err.mapOr(false, (value) => true)).toBe(false);

    await expect(ok.mapOrAsync(false, async (value) => true)).resolves.toBe(
      true
    );
    await expect(err.mapOrAsync(false, async (value) => true)).resolves.toBe(
      false
    );

    expect(
      ok.mapOrElse(
        (value) => false,
        (value) => true
      )
    ).toBe(true);
    expect(
      err.mapOrElse(
        (value) => false,
        (value) => true
      )
    ).toBe(false);

    await expect(
      ok.mapOrElseAsync(
        async (value) => false,
        async (value) => true
      )
    ).resolves.toBe(true);
    await expect(
      err.mapOrElseAsync(
        async (value) => false,
        async (value) => true
      )
    ).resolves.toBe(false);
  });

  test('Opt Test', async () => {
    const some = new Some(2);
    const none = new None();

    expect(some.isSome()).toBe(true);
    expect(none.isSome()).toBe(false);

    expect(some.isNone()).toBe(false);
    expect(none.isNone()).toBe(true);

    expect(some.unwrap()).toBe(2);
    expect(none.unwrap).toThrow();

    expect(some.unwrapOr(3)).toBe(2);
    expect(none.unwrapOr(3)).toBe(3);

    expect(some.unwrapOrElse(() => 3)).toBe(2);
    expect(none.unwrapOrElse(() => 3)).toBe(3);

    await expect(some.unwrapOrElseAsync(async () => 3)).resolves.toBe(2);
    await expect(none.unwrapOrElseAsync(async () => 3)).resolves.toBe(3);

    expect(some.expect('expect')).toBe(2);
    expect(() => none.expect('expect')).toThrow('expect');

    expect(some.and(new Some(3)).unwrapOr(5)).toBe(3);
    expect(some.and(new None()).unwrapOr(5)).toBe(5);
    expect(none.and(new Some(3)).unwrapOr(5)).toBe(5);
    expect(none.and(new None()).unwrapOr(5)).toBe(5);

    expect(some.andThen((some) => new Some(some * 2)).unwrapOr(3)).toBe(4);
    expect(some.andThen((some) => new None()).unwrapOr(3)).toBe(3);
    expect(none.andThen((some) => new Some(some * 2)).unwrapOr(3)).toBe(3);
    expect(none.andThen((some) => new None()).unwrapOr(3)).toBe(3);

    await expect(
      some
        .andThenAsync(async (some) => new Some(some * 2))
        .then((x) => x.unwrapOr(3))
    ).resolves.toBe(4);
    await expect(
      some.andThenAsync(async (some) => new None()).then((x) => x.unwrapOr(3))
    ).resolves.toBe(3);
    await expect(
      none
        .andThenAsync(async (some) => new Some(some * 2))
        .then((x) => x.unwrapOr(3))
    ).resolves.toBe(3);
    await expect(
      none.andThenAsync(async (some) => new None()).then((x) => x.unwrapOr(3))
    ).resolves.toBe(3);

    expect(some.filter((x) => true).unwrapOr(3)).toBe(2);
    expect(none.filter((x) => true).unwrapOr(3)).toBe(3);

    expect(some.filter((x) => false).unwrapOr(3)).toBe(3);
    expect(none.filter((x) => false).unwrapOr(3)).toBe(3);

    await expect(
      some.filterAsync(async (x) => true).then((x) => x.unwrapOr(3))
    ).resolves.toBe(2);
    await expect(
      none.filterAsync(async (x) => true).then((x) => x.unwrapOr(3))
    ).resolves.toBe(3);

    await expect(
      some.filterAsync(async (x) => false).then((x) => x.unwrapOr(3))
    ).resolves.toBe(3);
    await expect(
      none.filterAsync(async (x) => false).then((x) => x.unwrapOr(3))
    ).resolves.toBe(3);

    expect(some.map((x) => x * 2).unwrapOr(3)).toBe(4);
    expect(none.map((x) => x * 2).unwrapOr(3)).toBe(3);

    await expect(
      some.mapAsync(async (x) => x * 2).then((x) => x.unwrapOr(3))
    ).resolves.toBe(4);
    await expect(
      none.mapAsync(async (x) => x * 2).then((x) => x.unwrapOr(3))
    ).resolves.toBe(3);

    expect(some.mapOr(3, (x) => x * 2)).toBe(4);
    expect(none.mapOr(3, (x) => x * 2)).toBe(3);

    await expect(some.mapOrAsync(3, async (x) => x * 2)).resolves.toBe(4);
    await expect(none.mapOrAsync(3, async (x) => x * 2)).resolves.toBe(3);

    expect(
      some.mapOrElse(
        () => 3,
        (x) => x * 2
      )
    ).toBe(4);
    expect(
      none.mapOrElse(
        () => 3,
        (x) => x * 2
      )
    ).toBe(3);

    await expect(
      some.mapOrElseAsync(
        async () => 3,
        async (x) => x * 2
      )
    ).resolves.toBe(4);
    await expect(
      none.mapOrElseAsync(
        async () => 3,
        async (x) => x * 2
      )
    ).resolves.toBe(3);

    expect(some.okOr(3).unwrap()).toBe(2);
    expect(none.okOr(3).unwrapErr()).toBe(3);

    expect(some.okOrElse(() => 3).unwrap()).toBe(2);
    expect(none.okOrElse(() => 3).unwrapErr()).toBe(3);

    await expect(
      some.okOrElseAsync(async () => 3).then((x) => x.unwrap())
    ).resolves.toBe(2);
    await expect(
      none.okOrElseAsync(async () => 3).then((x) => x.unwrapErr())
    ).resolves.toBe(3);

    expect(some.or(new Some(3)).unwrapOr(5)).toBe(2);
    expect(none.or(new Some(3)).unwrapOr(5)).toBe(3);

    expect(some.or(new None()).unwrapOr(5)).toBe(2);
    expect(none.or(new None()).unwrapOr(5)).toBe(5);

    expect(some.orElse(() => new Some(3)).unwrapOr(5)).toBe(2);
    expect(none.orElse(() => new Some(3)).unwrapOr(5)).toBe(3);

    expect(some.orElse(() => new None()).unwrapOr(5)).toBe(2);
    expect(none.orElse(() => new None()).unwrapOr(5)).toBe(5);

    await expect(
      some.orElseAsync(async () => new Some(3)).then((x) => x.unwrapOr(5))
    ).resolves.toBe(2);
    await expect(
      none.orElseAsync(async () => new Some(3)).then((x) => x.unwrapOr(5))
    ).resolves.toBe(3);

    await expect(
      some.orElseAsync(async () => new None()).then((x) => x.unwrapOr(5))
    ).resolves.toBe(2);
    await expect(
      none.orElseAsync(async () => new None()).then((x) => x.unwrapOr(5))
    ).resolves.toBe(5);

    expect(some.zip(new Some(3)).unwrapOr([0, 0])).toEqual([2, 3]);
    expect(none.zip(new Some(3)).unwrapOr([0, 0])).toEqual([0, 0]);

    expect(some.zip(new None()).unwrapOr([0, 0])).toEqual([0, 0]);
    expect(none.zip(new None()).unwrapOr([0, 0])).toEqual([0, 0]);

    expect(
      some
        .zip(new Some(3))
        .unzip(2)
        .map((x) => x.unwrapOr(0))
    ).toEqual([2, 3]);
    expect(
      none
        .zip(new None())
        .unzip(2)
        .map((x) => x.unwrapOr(0))
    ).toEqual([0, 0]);

    expect(some.xor(new Some(3)).unwrapOr(0)).toBe(0);
    expect(some.xor(new None()).unwrapOr(0)).toBe(2);
    expect(none.xor(new Some(3)).unwrapOr(0)).toBe(3);
    expect(none.xor(new None()).unwrapOr(0)).toBe(0);
  });
}
