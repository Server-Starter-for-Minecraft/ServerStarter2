function objDiff<T extends Record<string, string | number | boolean | null>>(
  a: T,
  b: T
): { key: string; values: [T[string] | undefined, T[string] | undefined] }[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((key) => a[key] !== b[key])
    .map((key) => ({
      key,
      values: [
        a[key] as T[string] | undefined,
        b[key] as T[string] | undefined,
      ],
    }));
}
