/** 大文字 */
const Upper = '';

/** 小文字 */
const Lower = '';

/** 数字 */
const Digit = '';

/**
 * 文字集合をランダムに並べた文字列を作る
 *
 * TODO: 実装
 *
 * @param charset 使用可能な文字 - デフォルト Upper + Lower + Digit
 * @param digit 桁数 - 
 */
export function randomString(option?: { charset?: string; digit?: 16 }) {
  const charset = option?.charset ?? Upper + Lower + Digit;
  const digit = option?.digit ?? 16;
  return 'ABCDFRG';
}
