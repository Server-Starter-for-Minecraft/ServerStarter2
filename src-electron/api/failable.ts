export type Failable<S, F extends Error = Error> = S | F;

export function isSuccess<S, F extends Error>(
  value: Failable<S, F>
): value is S {
  return !(value instanceof Error);
}

export function isFailure<S, F extends Error>(
  value: Failable<S, F>
): value is F {
  return value instanceof Error;
}
