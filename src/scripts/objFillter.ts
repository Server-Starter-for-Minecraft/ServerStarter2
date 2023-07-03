export type Entries<T extends Record<PropertyKey, any>> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export const toEntries = <T extends Record<string, any>>(object: T): Entries<T> =>
  Object.entries(object) as Entries<T>;

export const fromEntries = <T extends Record<PropertyKey, any>>(
  object: Entries<T>
): T => Object.fromEntries(object) as T;



export function recordKeyFillter<K extends string, L extends K, V>(
  rec: Record<K, V>,
  predicate: (key: K) => key is L
): Record<L, V>

export function recordKeyFillter<K extends string, V>(
  rec: Record<K, V>,
  predicate: (key: K) => boolean
): Record<K, V>

export function recordKeyFillter<K extends string, V>(
  rec: Record<K, V>,
  predicate: (key: K) => boolean
) {
  const entries = toEntries(rec).filter(([k,]) => predicate(k))
  return fromEntries(entries)
}