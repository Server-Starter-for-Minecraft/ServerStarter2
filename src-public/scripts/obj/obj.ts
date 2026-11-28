export type Entries<T extends Record<PropertyKey, unknown>> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export const toEntries = <T extends Record<string, unknown>>(
  object: T
): Entries<T> => Object.entries(object) as Entries<T>;

export const fromEntries = <T extends Record<PropertyKey, unknown>>(
  object: Entries<T>
): T => Object.fromEntries(object) as T;

export const keys = <K extends string, V>(object: Record<K, V>): K[] =>
  Object.keys(object) as K[];

export const values = <K extends string | number | symbol, V>(
  object: Record<K, V>
): V[] => Object.values(object) as V[];

/**
 * オブジェクト自身が持つキーの値を返す
 *
 * `object[key]` と異なり，`constructor`・`toString` などの継承したキーの値（Object.prototype の関数など）は返さない。
 * 外部のデータ（外部リソース・設定ファイルなど）由来の任意のキーで値を引く場合に使う
 *
 * @param object 値を引くオブジェクト
 * @param key キー
 * @returns 自身が持つキーの値（持たない場合は `undefined`）
 */
export function getOwn<V>(
  object: Readonly<Partial<Record<string, V>>>,
  key: string
): V | undefined {
  return Object.hasOwn(object, key) ? object[key] : undefined;
}

export function isExistKey<K extends string | number | symbol, V>(
  object: Record<K, V>,
  key: K
) {
  return !!keys(object).find((k) => k === key);
}

export function deleteFromValue<T>(arr: T[], val: T) {
  arr.splice(arr.indexOf(val), 1);
}

export async function getHashData(object: unknown) {
  const uint8 = new TextEncoder().encode(JSON.stringify(object));
  const digest = await crypto.subtle.digest('SHA-256', uint8);
  return Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}
