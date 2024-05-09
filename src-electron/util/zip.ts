// https://stackoverflow.com/questions/62116454/how-to-type-define-a-zip-function-in-typescript

export function zip<T extends unknown[][]>(
  ...args: T
): { [K in keyof T]: T[K] extends (infer V)[] ? V : never }[] {
  const minLength = Math.min(...args.map((arr) => arr.length));
  // @ts-expect-error This is too much for ts
  return new Array(minLength).fill(0).map((_, i) => args.map((arr) => arr[i]));
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('zip', () => {
    const a = [1, 2, 3, 4, 5];
    const b = ['a', 'b', 'c', 'd'];

    const result = [
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
      [4, 'd'],
    ];

    expect(zip(a, b)).toEqual(result);

    expect(zip([], [])).toEqual([]);
  });
}
