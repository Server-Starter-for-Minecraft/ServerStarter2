import type { FlattenErrorMessageTypes } from '../util/error/schema';

export type ErrorLevel = 'info' | 'error';

/** エラーをオブジェクトとして渡す際の型
 * keyはi18nのキーが入るかな？
 */
export type ErrorMessage = {
  [K in keyof FlattenErrorMessageTypes]: {
    type: 'error';
    level: ErrorLevel;
    key: K;
    arg: FlattenErrorMessageTypes[K];
  };
}[keyof FlattenErrorMessageTypes];