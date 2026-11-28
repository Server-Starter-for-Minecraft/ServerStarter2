/**
 * 値が配列の要素のいずれかであるかを判定し，要素の型として扱えるようにする（型ガード）
 *
 * `Array.prototype.includes` は引数に要素の型を求めるため，型の分からない値を判定するときに使う
 *
 * @param values 要素の一覧
 * @param value 判定する値
 * @returns 値が要素のいずれかであれば true（値を要素の型 T として扱える）
 */
export function includes<T>(values: readonly T[], value: unknown): value is T {
  // 要素の型を広げて，型の分からない値でも includes で判定する（判定の方法は includes と同じ）
  const list: readonly unknown[] = values;
  return list.includes(value);
}
