import type {
  ErrorMessageTypes,
  FlattenErrorMessageTypes,
} from '../util/error/schema';
import { MessageTranslation } from '../util/message/base';

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

export type Failable<T> = T | ErrorMessage;

/**
 * 複数のエラーと正常値を同時に保持する型
 */
export type WithError<T> = { value: T; errors: ErrorMessage[] };

export type ErrorTranslationTypes = MessageTranslation<ErrorMessageTypes>;
