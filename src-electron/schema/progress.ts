// プログレスの進捗状態を通知する型定義群

import { ProgressMessage } from './progressMessage';

// すべてのデータを送信するのではなく、変更箇所のみ値が入り、それ以外はundefinedになる
// プロパティの削除を通知する場合は、削除箇所の値がnullになる

export type IProgress = {
  title?: ProgressMessage | null;
  description?: ProgressMessage | null;
  sub?: Record<string, Progress> | null;
};

/** タイトルと説明文があるだけのプログレス */
export type PlainProgress = {
  type: 'plain';
} & IProgress;

/** 進捗を数値で表せるプログレス */
export type NumericProgress = {
  type: 'numeric';
  value?: number | null;
  // 最大値(存在する場合)
  max?: number | null;
} & IProgress;

/** コンソールのプログレス */
export type ConsoleProgress = {
  type: 'console';
  // コンソールの文字列(一行)
  value?: string | null;
} & IProgress;

export type Progress = PlainProgress | NumericProgress | ConsoleProgress;
