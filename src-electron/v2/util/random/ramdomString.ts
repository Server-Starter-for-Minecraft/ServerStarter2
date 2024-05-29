/** 大文字 */
const Upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** 小文字 */
const Lower = 'abcdefghijklmnopqrstuvwxyz';

/** 数字 */
const Digit = '0123456789';

/**
 * 文字集合をランダムに並べた文字列を作る
 *
 * TODO: 実装 @MojaMonchi @nozz-mat
 *
 * @param charset 使用可能な文字 - デフォルト Upper + Lower + Digit
 * @param digit 桁数 -
 */
export function randomString(option?: { charset?: string; digit?: number }) {
  const charset = option?.charset ?? Upper + Lower + Digit;
  const digit = option?.digit ?? 16;

  let result = '';

  for (let i = 0; i < digit; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    const randomCharacter = charset.charAt(randomIndex);
    result = `${result}${randomCharacter}`;
  }

  return result;
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('randomString', () => {
    // 引数なしで実行した場合 16 桁の A-Za-z0-9 からなる配列を返す
    expect(randomString()).toMatch(/[A-Za-z0-9]{16}/);

    // digit=10 で実行した場合 10 桁の A-Za-z0-9 からなる配列を返す
    expect(randomString({ digit: 10 })).toMatch(/[A-Za-z0-9]{10}/);

    // charset=abc 実行した場合 16 桁の abc からなる配列を返す
    expect(randomString({ charset: 'abc' })).toMatch(/[abc]{16}/);

    // digit=10 charset=abc で実行した場合 10 桁の abc からなる配列を返す
    expect(randomString({ charset: 'abc', digit: 10 })).toMatch(/[abc]{10}/);

    expect(randomString({ charset: '.+*\'"`\\/', digit: 20 })).toMatch(/[\\.\\+\\*\\'\\"\\`\\\\\/]{20}/);

    expect(randomString({ digit: 0 })).toMatch('');
  });
}
