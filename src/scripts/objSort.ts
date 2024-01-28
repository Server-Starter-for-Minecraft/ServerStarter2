import { fromEntries, toEntries } from './obj';

export function strSort(a: string, b: string) {
  if (a.toLowerCase() < b.toLowerCase()) return -1;
  else if (a.toLowerCase() > b.toLowerCase()) return 1;
  return 0;
}

/**
 * Dictのキーを基にソートする
 */
export function sort<V>(obj: Record<string, V>) {
  const sortedEntries = toEntries(obj).sort((a, b) => strSort(a[0], b[0]));
  return fromEntries(sortedEntries);
}

/**
 * DictのValueを基にソートする
 *
 * ソートするためにはValue同士の大小を定義する関数を渡す
 */
export function sortValue<K extends string, V>(
  obj: Record<K, V>,
  evalFunc: (val1: V, val2: V) => number
) {
  const sortedEntries = toEntries(obj).sort((a, b) => evalFunc(a[1], b[1]));
  return fromEntries(sortedEntries);
}
