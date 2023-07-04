import { fromEntries, toEntries } from "./obj"


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

export async function asyncFilter<T>(array: T[], asyncCallback:(v: T) => Promise<boolean>) {
  const bits = await Promise.all(array.map(asyncCallback));
  return array.filter((_, i) => bits[i]);
}