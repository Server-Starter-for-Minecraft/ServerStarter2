export type Entries<T extends Record<PropertyKey, unknown>> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export const toEntries = <T extends Record<string, unknown>>(
  object: T
): Entries<T> => Object.entries(object) as Entries<T>;

export const fromEntries = <T extends Record<PropertyKey, unknown>>(
  object: Entries<T>
): T => Object.fromEntries(object) as T;
