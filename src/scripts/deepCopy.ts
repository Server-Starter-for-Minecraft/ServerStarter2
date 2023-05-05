export type Copyable =
  | string
  | number
  | boolean
  | null
  | undefined
  | CopyableArray
  | CopyableObject;

export interface CopyableArray extends Array<Copyable> {}
export interface CopyableObject extends Record<string, Copyable> {}

/**
 * 参照渡しではなく、値渡しを行いたいときに使用する
 */
// オブジェクトを再帰的にコピー
export function deepCopy<T extends Copyable>(obj: T): T {
  switch (typeof obj) {
    case 'string':
    case 'boolean':
    case 'number':
      return obj;
    case 'undefined':
      return undefined as T;
    case 'object':
      if (obj === null) return null as T;
      if (obj instanceof Array) return obj.map(deepCopy) as T;
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, deepCopy(v)])
      ) as T;
    default:
      throw Error(`${typeof obj} object is not valid in deepcopy`);
  }
}
