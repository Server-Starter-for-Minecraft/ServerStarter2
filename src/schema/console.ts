/** コンソールに表示する各行が持つデータ */
export type ConsoleData = { chunk: string; isError: boolean };

/** 検索結果を反映した各行のデータ */
export type MatchedConsoleData = { isError: boolean; matches: MatchResult[] };

/** ワールドの実行状態 */
export type WorldStatus = 'Stop' | 'Ready' | 'Running' | 'CheckLog';

/** 入力文字に対するコンソール１行当たりの検索結果 */
export type MatchResult = { text: string; isMatch: boolean };

/** コンソール全体に対する検索結果 */
export type SearchResult = { lineIdx: number; matches: ConsoleData[] };
