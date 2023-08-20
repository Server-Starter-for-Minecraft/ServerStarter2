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
};

/** 編集済みのシステム設定まとめてここに格納 */
export type SystemSettingsEdited = {
  container: WorldContainers;
  world: SystemWorldSettings;
  remote: SystemRemoteSetting;
  player: SystemPlayerSetting;
  user: SystemUserSetting;
};

export const locales = ['ja', 'en-US'] as const;
/** 言語 */
export type Locale = (typeof locales)[number];

export const colorThemes = ['light', 'auto', 'dark'] as const;
export type ColorTheme = (typeof colorThemes)[number];

export type SystemUserSetting = {
  // ServerStarterの利用規約同意状況
  eula: boolean;
  // カラーテーマ Light/Dark
  theme: ColorTheme;
  // 色覚サポート
  visionSupprot: boolean;
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
  groups: { [name: string]: PlayerGroup };
  players: PlayerUUID[];
};

export type SystemRemoteSetting = RemoteSetting[];
