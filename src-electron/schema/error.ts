import type { ErrorMessageTypes } from '../util/error/schema';

export type ErrorLevel = 'info' | 'error';

/** エラーをオブジェクトとして渡す際の型
 * keyはi18nのキーが入るかな？
 */
export type ErrorMessage = {
  [K in keyof ErrorMessageTypes]: {
    type: 'error';
    level: ErrorLevel;
    key: K;
    args: ErrorMessageTypes[K];
  };
}[keyof ErrorMessageTypes];
