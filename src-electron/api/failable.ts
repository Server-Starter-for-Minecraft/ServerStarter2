export type Failable<S, F extends Error = Error> = S | F;

export const isSuccess = <S, F extends Error>(
  value: Failable<S, F>
): value is S => !(value instanceof Error);

export const isFailure = <S, F extends Error>(
  value: Failable<S, F>
): value is F => value instanceof Error;
