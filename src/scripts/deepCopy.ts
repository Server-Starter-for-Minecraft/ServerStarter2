import { toRaw } from "vue";

/**
 * 参照渡しではなく、値渡しを行いたいときに使用する
 */
export function deepCopy<T>(val: T, options?: StructuredSerializeOptions): T {
  return structuredClone(toRaw(val), options)
}