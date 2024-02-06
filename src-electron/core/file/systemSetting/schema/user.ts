export type UserSettings$1 = {
  // ServerStarterの利用規約同意状況
  eula: boolean;
  // カラーテーマ Light/Dark
  theme: ColorTheme$1;
  // 色覚サポート
  visionSupport: boolean;
  // システム言語
  language: Locale$1;
  // 実行者情報
  owner: string | undefined;

  /** 実行環境ID(特に変更の必要なし) */
  id: string;

  // 自動シャットダウン
  autoShutDown: boolean;
  // ワールドリストの幅
  drawerWidth: number;

  // NgrokのToken
  ngrokToken?: string;
};

/** 言語 */
export type Locale$1 = 'ja' | 'en-US';

export type ColorTheme$1 = 'light' | 'auto' | 'dark';
