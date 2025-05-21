
/** 入力文字に対するコンソール１行当たりの検索結果 */
export type MatchResult = { text: string; isMatch: boolean };

/** コンソール全体に対する検索結果 */
export type SearchResult = { lineIdx: number; matches: MatchResult[] };