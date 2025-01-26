/**
 * TODO: 最終的にはこのファイルは削除して，エラー構造はResult型に変更
 */
import { z } from 'zod';
import type {
  ErrorMessageTypes,
  FlattenErrorMessageTypes,
} from '../util/error/schema';
import { MessageDescTitleTranslation } from '../util/message/base';

export const ErrorLevel = z.enum(['info', 'error']);
export type ErrorLevel = z.infer<typeof ErrorLevel>;

/**
 * エラーをオブジェクトとして渡す際の型
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

export type ErrorTranslationTypes =
  MessageDescTitleTranslation<ErrorMessageTypes>;
