// 開発用Util

/**
 * debug用 コンソールに出力しながら引数をそのまま返す
 *
 * const a = debug(100)
 * // console: 100
 * expect(a).toBe(100)
 */
export const debug = <T>(value: T): T => {
  console.debug(value);
  return value;
};
