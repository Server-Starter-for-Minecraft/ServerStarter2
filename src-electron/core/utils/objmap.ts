export function objMap<K extends string, V, K2 extends string, V2>(
  object: { [key in K]: V },
  func: (key: K, value: V, index: number) => [K2, V2]
): {
  [key in K2]: V2;
} {
  const entries: [K, V][] = Object.entries<V>(object) as [K, V][];
  const mapped: [K2, V2][] = entries.map(([key, value], index) =>
    func(key, value, index)
  );
  return Object.fromEntries(mapped) as { [key in K2]: V2 };
}

export function objEach<K extends string, V>(
  object: { [key in K]: V },
  func: (key: K, value: V, index: number) => void
): void {
  const entries: [K, V][] = Object.entries<V>(object) as [K, V][];
  entries.forEach(([key, value], index) => func(key, value, index));
}
