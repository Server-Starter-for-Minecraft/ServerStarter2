export type Entries<T extends Record<PropertyKey, any>> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export const toEntries = <T extends Record<string, any>>(
  object: T
): Entries<T> => Object.entries(object) as Entries<T>;

export const fromEntries = <T extends Record<PropertyKey, any>>(
  object: Entries<T>
): T => Object.fromEntries(object) as T;

export const keys = <K extends string | number | symbol, V>(
  object: Record<K, V>
): K[] => Object.keys(object) as K[];

export const values = <K extends string | number | symbol, V>(
  object: Record<K, V>
): V[] => Object.values(object) as V[];

export function isExistKey<K extends string | number | symbol, V>(
  object: Record<K, V>,
  key: K
) {
  return !!keys(object).find((k) => k === key);
}

export function deleteFromValue<T>(arr: T[], val: T) {
  arr.splice(arr.indexOf(val), 1);
}

export async function getHashData(object: any) {
  const uint8 = new TextEncoder().encode(JSON.stringify(object));
  const digest = await crypto.subtle.digest('SHA-256', uint8);
  return Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}
