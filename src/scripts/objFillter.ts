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

export function uniqueArrayDict<T extends Record<string, any>>(dicts: T[], key: keyof T) {
  // 特定のキーを基にしたSetを作る
  const set = new Set(dicts.map((obj) => obj[key]));

  // Setに含まれるキーだけを残す
  const uniqueArray = dicts.filter((obj) => {
    // Setにキーがあればtrueを返す
    const result = set.has(obj[key]);
    // Setから特定のキー削除する（次に同じキーが出てきたら排除する）
    set.delete(obj[key]);
    // 結果を返す
    return result;
  });

  return uniqueArray
}