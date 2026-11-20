import type { ErrorMessage } from 'app/src-electron/schema/error';
import { isError } from '../error';

/**
 * 完了を待たずに非同期処理を実行する
 *
 * 待たれない Promise の失敗は誰にも気付かれないため，完了を待たない呼び出しは必ずこの関数を通す
 * （lint の `@typescript-eslint/no-floating-promises` は，この関数に渡した Promise のみ許可する）。
 * 処理の失敗（Failable のエラーを返した場合・WithError の value がエラーの場合・例外が発生した場合）は `onError` に渡す。
 * WithError の errors（成功扱いの内部のエラー）は，処理の呼び出し元の方針に従うため渡さない
 *
 * @param task 実行中の非同期処理
 * @param onError 失敗したときの処理（バックエンドではロガー，フロントエンドではエラー表示に渡す）
 */
export function runDetached(
  task: Promise<unknown>,
  onError: (error: unknown) => void
): void {
  task.then((result) => {
    if (isError(result)) onError(result);
    else if (isWithErrorFailure(result)) onError(result.value);
  }, onError);
}

/** WithError の形の値で，value がエラーであるか */
function isWithErrorFailure(value: unknown): value is { value: ErrorMessage } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'errors' in value &&
    isError(value.value)
  );
}
