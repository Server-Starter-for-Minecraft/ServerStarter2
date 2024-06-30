import { objValueMap } from './obj/objmap';

type Copyable =
  | string
  | number
  | boolean
  | null
  | undefined
  | CopyableArray
  | CopyableObject;

interface CopyableArray extends Array<Copyable> {}
interface CopyableObject extends Record<string, Copyable> {}

// オブジェクトを再帰的にコピー
export function deepcopy<T>(obj: T): T {
  switch (typeof obj) {
    case 'string':
    case 'boolean':
    case 'number':
      return obj;
    case 'undefined':
      return undefined as T;
    case 'object':
      if (obj === null) return null as T;
      if (obj instanceof Array) return obj.map(deepcopy) as T;
      return objValueMap<string, Copyable, Copyable>(
        obj as CopyableObject,
        deepcopy
      ) as T;
    default:
      throw Error(`${typeof obj} object is not valid in deepcopy`);
  }
}
