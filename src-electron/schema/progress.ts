// プログレスの進捗状態を通知する型定義群

import { ProgressMessage } from './progressMessage';

// すべてのデータを送信するのではなく、変更箇所のみ値が入り、それ以外はundefinedになる
// プロパティの削除を通知する場合は、削除箇所の値がDeletedになる

export const deleted = Symbol();
export type Deleted = typeof deleted;

export type IProgress = {
  title?: ProgressMessage | Deleted;
  description?: ProgressMessage | Deleted;
  sub?: Record<string, Progress> | Deleted;
};

/** タイトルと説明文があるだけのプログレス */
export type PlainProgress = {
  type: 'plain';
} & IProgress;

/** 進捗を数値で表せるプログレス */
export type NumericProgress = {
  type: 'numeric';
  value?: number | Deleted;
  // 最大値(存在する場合)
  max?: number | Deleted;
} & IProgress;

/** コンソールのプログレス */
export type ConsoleProgress = {
  type: 'console';
  // コンソールの文字列(一行)
  value?: string | Deleted;
} & IProgress;

export type Progress = PlainProgress | NumericProgress | ConsoleProgress;
