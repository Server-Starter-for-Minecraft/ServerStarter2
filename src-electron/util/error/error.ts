import { ErrorMessage } from 'app/src-electron/schema/error';
import { errorMessage } from './construct';

export const isValid = <S>(value: ErrorMessage | S): value is S =>
  !isError(value);

export const isError = <S>(value: ErrorMessage | S): value is ErrorMessage =>
  Boolean(value) && (value as ErrorMessage).type === 'error';

/** Error|anyを受け取ってErrorだった場合Errormessageにして返却する
 * (catch節で実行することを想定) */
export function fromRuntimeError(error: any) {
  if (error instanceof Error) {
    return errorMessage.runtime({
      type: error.constructor.name,
      message: error.message,
    });
  } else {
    throw error;
  }
}
