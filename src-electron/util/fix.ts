import { deepcopy } from './deepcopy';

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> | undefined }
  : T;

export function fix<T extends { [x: string]: any }>(
  value: DeepPartial<T> | undefined,
  defaultValue: T
): T {
  if (value === undefined) return deepcopy<T>(defaultValue);

  return Object.fromEntries(
    Object.entries(defaultValue).map(([k, v]) => {
      const val = value?.[k];

      if (v instanceof Array) {
        if (val instanceof Array) {
          return [k, val];
        }
        return [k, deepcopy(v)];
      }

      if (typeof v === 'object' && v !== null) {
        return [k, fix(val as { [x: string]: any }, v as { [x: string]: any })];
      }
      return [k, val ?? deepcopy(v)];
    })
  ) as T;
}
