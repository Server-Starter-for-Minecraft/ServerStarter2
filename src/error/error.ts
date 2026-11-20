import { isError, isValid } from 'app/src-public/scripts/error';
import { ErrorMessage, Failable } from 'app/src-electron/schema/error';
import { tError } from 'src/i18n/utils/tFunc';

let _openDialogFunc: (args: iErrorDialogProps) => void;
export function setOpenDialogFunc(func: (args: iErrorDialogProps) => void) {
  _openDialogFunc = func;
}

export interface iErrorDialogProps {
  title: string;
  desc?: string;
}

export type ErrorFuncReturns = { title: string; desc?: string };

/**
 * エラーが発生する可能性のある変数をチェックし、エラーがある場合はエラー画面を表示する
 * @param check エラーチェックをする変数
 * @param successProcess エラーがなかった場合の処理
 * @param errorDescription エラーが起きた場合の説明文
 */
export function checkError<S>(
  check: Failable<S>,
  successProcess: ((checked: S) => void) | undefined,
  errorDescription:
    ((error: ErrorMessage) => ErrorFuncReturns | undefined) | undefined
) {
  if (isValid(check)) {
    if (successProcess !== void 0) successProcess(check);
    return check;
  } else {
    if (errorDescription !== void 0) {
      const errorMessage = errorDescription(check);
      if (errorMessage) {
        _openDialogFunc({
          title: errorMessage.title,
          desc: errorMessage.desc,
        });
      }
    }

    // TODO: エラー画面を表示するのはFailableではない未知のエラー（RuntimeError）の時のみとし、
    // Failableによるエラーは画面の左下に表示するだけ、などの処理に変更
    // _router.replace('/error')
  }
}

/**
 * フロントエンドから右下のエラー表示を出したい場合に呼び出す
 */
export function sendError(title: string, desc?: string) {
  _openDialogFunc({
    title: title,
    desc: desc,
  });
}

/**
 * 捕捉した例外（または Failable のエラー）を ErrorMessage に変換する
 *
 * @param error 捕捉した例外，または Failable のエラー
 * @returns エラーの内容を表す ErrorMessage
 */
export function toErrorMessage(error: unknown): ErrorMessage {
  if (isError(error)) return error;
  return {
    type: 'error',
    key: 'system.runtime',
    level: 'error',
    arg: {
      type: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    },
  };
}

/**
 * 関数を実行し，例外が発生した場合は ErrorMessage にして返す（フロントエンド用）
 *
 * 外部ライブラリやブラウザの API が投げる例外は，この関数で Failable に変換する
 *
 * @param func 例外を投げる可能性のある関数
 * @returns 関数の戻り値（例外が発生した場合はエラー）
 */
export function safeExec<T>(func: () => T): Failable<T> {
  try {
    return func();
  } catch (e) {
    return toErrorMessage(e);
  }
}

/**
 * 非同期関数を実行し，例外が発生した場合は ErrorMessage にして返す（フロントエンド用）
 *
 * @param func 例外を投げる可能性のある非同期関数
 * @returns 関数の戻り値（例外が発生した場合はエラー）
 */
export async function safeExecAsync<T>(
  func: () => Promise<T>
): Promise<Failable<T>> {
  try {
    return await func();
  } catch (e) {
    return toErrorMessage(e);
  }
}

/**
 * 意図して無視してよいエラーであることを明示する（フロントエンド用）
 *
 * バックエンドの API が返したエラーは API の監視でログに残っているため，フロントエンドでは記録しない。
 * 戻り値は常に undefined のため，`isValid(x) ? x : ignoreError(x, '理由')` のように値の代わりにも使える
 *
 * @param _error 無視するエラー
 * @param _reason 無視してよい理由
 * @returns 常に undefined
 */
export function ignoreError(_error: ErrorMessage, _reason: string): undefined {
  return undefined;
}

/**
 * 完了を待たずに実行した処理（`runDetached`）などで発生した，予期しない失敗をエラー表示する
 *
 * @param error Failable のエラー，または発生した例外
 */
export function showUnexpectedError(error: unknown) {
  checkError(toErrorMessage(error), undefined, (e) => tError(e));
}
