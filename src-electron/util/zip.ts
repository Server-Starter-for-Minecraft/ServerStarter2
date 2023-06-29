// https://stackoverflow.com/questions/62116454/how-to-type-define-a-zip-function-in-typescript

export function zip<T extends unknown[][]>(
  ...args: T
): { [K in keyof T]: T[K] extends (infer V)[] ? V : never }[] {
  const minLength = Math.min(...args.map((arr) => arr.length));
  // @ts-expect-error This is too much for ts
  return range(minLength).map((i) => args.map((arr) => arr[i]));
}
