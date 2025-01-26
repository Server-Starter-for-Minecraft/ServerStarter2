/**
 * TODO: フロントエンドへの通信内容変更時に必要があれば更新する
 */

// プログレスの進捗状態を通知する型定義群
import { ProgressMessage } from './progressMessage';

/** タイトルのプログレス */
export type TitleProgress = {
  type: 'title';
  value: ProgressMessage;
};

/** 説明文のプログレス */
export type SubtitleProgress = {
  type: 'subtitle';
  value: ProgressMessage;
};

/**
 * NumericProgressで使用される単位
 * file : ファイルの個数
 * byte : 読み込みのバイト
 * percent : パーセント表示(maxは100固定)
 */
export type NumericProgressUnit = 'file' | 'byte' | 'percent';

/**
 * 数値のプログレス
 * pythonのtqdmっぽい感じ
 * maxがある場合はバーでない場合は数字だけでの表示を想定
 */
export type NumericProgress = {
  type: 'numeric';
  value: number;
  // 最大値(存在する場合)
  max?: number;
  unit: NumericProgressUnit;
};

/** コンソールのプログレス */
export type ConsoleProgress = {
  type: 'console';
  // コンソールの文字列配列
  value: string;
};

/** グループ化されたプログレス */
export type GroupProgress = {
  type: 'group';
  // コンソールの文字列配列
  value: Progress[];
};

/** プログレス一覧 */
export type Progress =
  | TitleProgress
  | SubtitleProgress
  | NumericProgress
  | ConsoleProgress
  | GroupProgress;
