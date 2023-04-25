export type Failable<S, F extends Error = Error> = S | F;

export const isSuccess = <S, F extends Error>(
  value: Failable<S, F>
): value is S => !(value instanceof Error);

export const isFailure = <S, F extends Error>(
  value: Failable<S, F>
): value is F => value instanceof Error;

export function failabilify<P extends any[], R>(
  func: (...args: P) => R
): (
  ...args: P
) => R extends Promise<infer S> ? Promise<Failable<S>> : Failable<R> {
  return ((...args: P) => {
    try {
      const result = func(...args);
      if (result instanceof Promise) {
        return result.then(
          (value) => value,
          (error) => error
        );
      } else {
        return result;
      }
    } catch (e) {
      if (e instanceof Error) {
        return e;
      } else {
        throw e;
      }
    }
  }) as (
    ...args: P
  ) => R extends Promise<infer S> ? Promise<Failable<S>> : Failable<R>;
}