import type { ErrorMessageTypes } from '../core/error/schema';

/** エラーをオブジェクトとして渡す際の型
 * keyはi18nのキーが入るかな？
 */
export type ErrorMessage = {
  [K in keyof ErrorMessageTypes]: {
    type: 'error';
    key: K;
    args: ErrorMessageTypes[K];
  };
}[keyof ErrorMessageTypes];
