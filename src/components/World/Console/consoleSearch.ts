import { ConsoleData, MatchedConsoleData } from 'src/schema/console';

/**
 * コンソールの検索ボックス（ConsoleSearch.vue）が親のコンポーネントへ公開する処理
 *
 * `.vue` のコンポーネントのインスタンスの型は lint の型解析で解決できない場合があるため，
 * 公開する処理の型をここで定義し，ConsoleSearch.vue では `satisfies` で一致を確認する
 */
export type ConsoleSearchExpose = {
  /** 検索ボックスの内容に一致する箇所を，各行に反映して返す */
  getMatchedLines(lines: ConsoleData[]): MatchedConsoleData[];
  /** 検索の表示・移動のキー操作を処理する */
  handleKeyDown(event: KeyboardEvent): void;
  /** 選択中の一致箇所がある行の番号（無い場合は -1） */
  currentFocusLineIdx: number;
};
