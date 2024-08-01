import { fromEntries, toEntries } from './obj';

// objectに対してmapできるようにする
export function objMap<K extends string, V, K2 extends string, V2>(
  object: { [key in K]: V },
  func: (key: K, value: V, index: number) => [K2, V2]
): {
  [key in K2]: V2;
} {
  const entries = toEntries(object);
  const mapped = entries.map(([key, value], index) => func(key, value, index));
  return fromEntries(mapped);
}

// objectに対してmapできるようにする
export function objValueMap<K extends string, V, V2>(
  object: { [key in K]: V },
  func: (value: V, key: K, index: number) => V2
): {
  [key in K]: V2;
} {
  const entries = toEntries(object);
  const mapped = entries.map(([key, value], index): [K, V2] => [
    key,
    func(value, key, index),
  ]);
  return fromEntries(mapped);
}

// objectに対してmapできるようにする
export function objKeyMap<K extends string, V, K2 extends string>(
  object: { [key in K]: V },
  func: (key: K, value: V, index: number) => K2
): {
  [key in K2]: V;
} {
  const entries = toEntries(object);
  const mapped = entries.map(([key, value], index): [K2, V] => [
    func(key, value, index),
    value,
  ]);
  return fromEntries(mapped);
}

// objectに対してforEachできるようにする
export function objEach<K extends string, V>(
  object: { [key in K]: V },
  func: (key: K, value: V, index: number) => void
): void {
  const entries = toEntries(object);
  entries.forEach(([key, value], index) => func(key, value, index));
}

// 非同期関数でmapする
export async function asyncMap<T, U>(
  values: Readonly<T[]>,
  func: (value: T, index: number) => Promise<U>
): Promise<U[]> {
  return await Promise.all(values.map(func));
}

// 非同期関数でforEachする
export async function asyncForEach<T>(
  values: T[],
  func: (value: T, index: number) => Promise<void>
): Promise<void> {
  await Promise.all(values.map(func));
}
