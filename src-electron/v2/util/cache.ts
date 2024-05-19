/**
 * 関数の実行結果を保持
 */
export function cacheRresult<T>(func: () => T): () => T {
  let result: T | undefined = undefined;

  return () => (result ??= func());
}
