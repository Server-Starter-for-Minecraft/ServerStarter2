export type Failable<S, F extends Error = Error> = S | F;

export const isSuccess = <S, F extends Error>(
  value: Failable<S, F>
): value is S => !(value instanceof Error);

export const isFailure = <S, F extends Error>(
  value: Failable<S, F>
): value is F => value instanceof Error;

export const failablify =
  <A extends any[], R>(func: (...args: A) => R) =>
  (...args: A): Failable<R> => {
    try {
      return func(...args);
    } catch (e) {
      if (e instanceof Error) {
        return e;
      } else {
        throw e;
      }
    }
  };
