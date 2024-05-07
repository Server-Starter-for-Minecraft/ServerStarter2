class PanicError extends Error {}

abstract class Result<T, E> {
  abstract is_ok(): boolean;
  abstract is_err(): boolean;
  abstract expect(message: string): T;
  abstract unwrap(): T;
  abstract unwrap_or(value: T): T;
  abstract unwrap_or_else(value: (err: E) => T): T;
  abstract expect_err(message: string): E;
  abstract unwrap_err(): E;
}

class Ok<T> extends Result<T, any> {
  is_ok(): boolean {
    return true;
  }
  is_err(): boolean {
    return false;
  }
  expect(message: string): T {
    return this.value;
  }
  unwrap(): T {
    return this.value;
  }
  unwrap_or(value: T): T {
    return this.value;
  }
  unwrap_or_else(func: (err: any) => T): T {
    return this.value;
  }
  expect_err<E>(message: string): E {
    throw new PanicError(message);
  }
  unwrap_err<E>(): E {
    throw new PanicError();
  }
  private value: T;
  constructor(value: T) {
    super();
    this.value = value;
  }
}

class Err<E> extends Result<any, E> {
  is_ok(): boolean {
    return false;
  }
  is_err(): boolean {
    return true;
  }
  expect<T>(message: string): T {
    throw new PanicError(message);
  }
  unwrap<T>(): T {
    throw new PanicError();
  }
  unwrap_or<T>(value: T): T {
    return value;
  }
  unwrap_or_else<T>(func: (err: any) => T): T {
    return func(this.value);
  }
  expect_err(message: string): E {
    return this.value;
  }
  unwrap_err(): E {
    return this.value;
  }
  private value: E;
  constructor(value: E) {
    super();
    this.value = value;
  }
}

abstract class Opt<T> {}

class Some<T> extends Opt<T> {}

class None extends Opt<any> {}

/** .mapのあるPromise */
class Future<T> extends Promise<T> {
  map<U>(func: (arg: T) => PromiseLike<U>): Future<U> {
    return new Future<U>((resolve, reject) => {
      return this.then((val) => {
        resolve(func(val));
      }).catch(reject);
    });
  }
}

