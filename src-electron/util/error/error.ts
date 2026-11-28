import { ErrorMessage } from 'app/src-electron/schema/error';
import { errorMessage } from './construct';

export const isValid = <S>(value: ErrorMessage | S): value is S =>
  !isError(value);

export const isError = <S>(value: ErrorMessage | S): value is ErrorMessage =>
  Boolean(value) && (value as ErrorMessage).type === 'error';

/**
 * 捕捉した例外を ErrorMessage に変換する（catch 節で実行することを想定）
 *
 * Error 以外の値が投げられた場合も，その値の型と文字列表現で ErrorMessage にする
 *
 * @param error 捕捉した例外
 * @returns 例外の内容を表す ErrorMessage
 */
export function fromRuntimeError(error: unknown) {
  if (error instanceof Error) {
    return errorMessage.system.runtime({
      type: error.constructor.name,
      message: error.message,
    });
  }
  return errorMessage.system.runtime({
    type: typeof error,
    message: String(error),
  });
}
