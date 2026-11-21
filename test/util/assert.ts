import { expect } from 'vitest';
import { Failable } from 'app/src-electron/schema/error';
import { isError } from 'app/src-electron/util/error/error';

/**
 * 処理が成功したことを確認し，以降は成功した値として扱えるようにする
 *
 * `expect(isError(x)).toBe(false); if (isError(x)) return;` の代わりに使う
 * （テストの中に条件分岐を書かずに，失敗した場合はエラーの内容を表示してテストを失敗させる）。
 * lint の `vitest/expect-expect` は，この関数の呼び出しも検証として扱う
 *
 * @param value 失敗しうる値
 */
export function assertOk<T>(value: Failable<T>): asserts value is T {
  // 成功した値は文字列にしない（循環参照などを含む値でも，成功ならテストを失敗させない）
  if (isError(value)) {
    expect.fail(`expected success: ${JSON.stringify(value)}`);
  }
}

/**
 * 値が存在する（undefined・null でない）ことを確認し，以降は存在する値として扱えるようにする
 *
 * `expect(x).toBeDefined(); if (!x) return;` の代わりに使う（テストの中に条件分岐を書かないため）
 *
 * @param value 存在するはずの値
 * @param message 存在しなかった場合に表示する内容
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message = 'expected a value to be defined'
): asserts value is T {
  if (value === undefined || value === null) expect.fail(message);
}
