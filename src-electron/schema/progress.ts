export type TranslationText = {
  key: string;
  args: Record<string, string>;
};

export type IProgress = {
  title: TranslationText;
  description?: TranslationText;
  sub?: Record<string, Progress>;
};

/** タイトルと説明文があるだけのプログレス */
export type PlainProgress = {
  type: 'plain';
} & IProgress;

/** 進捗を数値で表せるプログレス */
export type NumericProgress = {
  type: 'numeric';
  value: number;
  // 最大値(存在する場合)
  max?: number;
} & IProgress;

/** コンソールのプログレス */
export type ConsoleProgress = {
  type: 'console';
  // コンソールの文字列(一行)
  value: string;
} & IProgress;

export type Progress = PlainProgress | NumericProgress | ConsoleProgress;
