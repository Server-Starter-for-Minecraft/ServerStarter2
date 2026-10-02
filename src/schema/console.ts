/** ANSIの文字色（0~255のパレット番号、または `#RRGGBB` 形式のRGB値） */
export type AnsiColor = number | `#${string}`;

/** コンソールの文字に適用する装飾 */
export type AnsiStyle = {
  color?: AnsiColor;
  bgColor?: AnsiColor;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

/** 装飾を持ったテキストの断片 */
export type StyledText = { text: string; style: AnsiStyle };

/** コンソールに表示する各行が持つデータ */
export type ConsoleData = {
  /** 表示する文字列（装飾のための制御文字を除いたもの。検索に利用する） */
  chunk: string;
  isError: boolean;
  /** 文字色などの装飾ごとに分割した表示文字列（未指定の場合は装飾なし） */
  segments?: StyledText[];
  /** 次の出力で上書きされる行か（プログレスバーなど\rで終わる出力） */
  overwritable?: boolean;
};

/** 検索結果を反映した各行のデータ */
export type MatchedConsoleData = {
  isError: boolean;
  matches: MatchResult[];
  /** 文字色などの装飾（ConsoleData.segmentsと同じもの） */
  segments?: StyledText[];
};

/** ワールドの実行状態 */
export type WorldStatus = 'Stop' | 'Ready' | 'Running' | 'CheckLog';

/** 入力文字に対するコンソール１行当たりの検索結果 */
export type MatchResult = { text: string; isMatch: boolean };

/** コンソール全体に対する検索結果 */
export type SearchResult = { lineIdx: number; matches: ConsoleData[] };
