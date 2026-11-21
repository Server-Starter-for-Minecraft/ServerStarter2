import { isError } from '../error';

/**
 * 完了を待たずに非同期処理を実行する
 *
 * 待たれない Promise の失敗は誰にも気付かれないため，完了を待たない呼び出しは必ずこの関数を通す
 * （lint の `@typescript-eslint/no-floating-promises` は，この関数に渡した Promise のみ許可する）。
 * 処理の失敗（Failable のエラーを返した場合・例外が発生した場合）は `onError` に渡す
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
  }, onError);
}
