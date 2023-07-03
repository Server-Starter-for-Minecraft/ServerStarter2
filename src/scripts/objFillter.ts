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