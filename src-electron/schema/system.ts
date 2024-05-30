import { PlayerUUID, UUID, WorldContainer } from './brands';
import { PlayerGroup } from './player';
import { RemoteSetting } from './remote';
import { SystemWorldSettings } from './world';

/** システム設定まとめてここに格納 */
export type SystemSettings = {
  container: WorldContainers;
  world: SystemWorldSettings;
  remote: SystemRemoteSetting;
  player: SystemPlayerSetting;
  user: SystemUserSetting;

  /** 基本的にはフロントから編集不可の定数 */
  system: SystemSystemSetting;
};

export const locales = ['ja', 'en-US'] as const;
/** 言語 */
export type Locale = (typeof locales)[number];

export const colorThemes = ['light', 'auto', 'dark'] as const;
export type ColorTheme = (typeof colorThemes)[number];

export type SystemSystemSetting = {
  // 最終アップデート時刻
  lastUpdatedTime?: number;
};

export type ViewStyleSetting = {
  // プレイヤータブ
  player: 'list' | 'card';
  // 追加コンテンツタブ
  contents: 'list' | 'card';
}

export type SystemUserSetting = {
  // ServerStarterの利用規約同意状況
  eula: boolean;
  // カラーテーマ Light/Dark
  theme: ColorTheme;
  // 色覚サポート
  visionSupport: boolean;
  // システム言語
  language: Locale;
  // 実行者情報
  owner: PlayerUUID | undefined;

  /** 実行環境ID(特に変更の必要なし) */
  id: UUID;

  // 自動シャットダウン
  autoShutDown: boolean;
  // ワールドリストの幅
  drawerWidth: number;

  // NgrokのToken
  ngrokToken?: string;

  // 画面の表示形式を list or card で選択
  viewStyle: ViewStyleSetting;
};

export type WorldContainerSetting = {
  container: WorldContainer;
  visible: boolean;
  name: string;
};

/**
 * GetWorldContainersの戻り値
 * SetWorldContainersの引数
 */
export type WorldContainers = WorldContainerSetting[];

export type SystemPlayerSetting = {
  groups: { [name in string]: PlayerGroup };
  players: PlayerUUID[];
};

export type SystemRemoteSetting = RemoteSetting[];
