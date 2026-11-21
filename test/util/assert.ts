import { expect } from 'vitest';
import { Failable } from 'app/src-electron/schema/error';
import { isError } from 'app/src-electron/util/error/error';

/**
 * 処理が成功したことを確認し，以降は成功した値として扱えるようにする
 *
 * `expect(isError(x)).toBe(false); if (isError(x)) return;` の代わりに使う
 * （テストの中に条件分岐を書かずに，失敗した場合はエラーの内容を表示してテストを失敗させる）
 *
 * @param value 失敗しうる値
 */
export function assertOk<T>(value: Failable<T>): asserts value is T {
  expect(isError(value), `expected success: ${JSON.stringify(value)}`).toBe(
    false
  );
}
