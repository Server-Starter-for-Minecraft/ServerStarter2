export type Entries<T extends Record<PropertyKey, any>> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export const toEntries = <T extends Record<string, any>>(
  object: T
): Entries<T> => Object.entries(object) as Entries<T>;

export const fromEntries = <T extends Record<PropertyKey, any>>(
  object: Entries<T>
): T => Object.fromEntries(object) as T;

/**
 * obj[]の配列の特定のキーの値をキーとするオブジェクトを返す
 */
export function toRecord<T extends { [K in keyof T]: any }, K extends keyof T>(
  array: T[],
  selector: K
): Record<T[K], T> {
  return array.reduce(
    (acc, item) => ((acc[item[selector]] = item), acc),
    {} as Record<T[K], T>
  );
}
