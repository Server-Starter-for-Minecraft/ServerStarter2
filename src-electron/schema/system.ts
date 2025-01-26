import { z } from 'zod';
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
export const Locale = z.enum(locales);
export type Locale = z.infer<typeof Locale>;

export const colorThemes = ['light', 'auto', 'dark'] as const;
export const ColorTheme = z.enum(colorThemes);
export type ColorTheme = z.infer<typeof ColorTheme>;

export const SystemSystemSetting = z.object({
  // 最終アップデート時刻
  lastUpdatedTime: z.number().optional(),
});
export type SystemSystemSetting = z.infer<typeof SystemSystemSetting>;

export const ViewStyleSetting = z.object({
  /** プレイヤータブ */
  player: z.enum(['list', 'card']),
  /** 追加コンテンツタブ */
  contents: z.enum(['list', 'card']),
});
export type ViewStyleSetting = z.infer<typeof ViewStyleSetting>;

export const SystemUserSetting = z.object({
  /** ServerStarterの利用規約同意状況 */
  eula: z.boolean(),
  /** カラーテーマ Light/Dark */
  theme: ColorTheme,
  /** 色覚サポート */
  visionSupport: z.boolean(),
  /** システム言語 */
  language: Locale,
  /** 実行者情報 */
  owner: PlayerUUID.optional(),
  /** 実行環境ID(特に変更の必要なし) */
  id: UUID,
  /** 自動シャットダウン */
  autoShutDown: z.boolean(),
  /** ワールドリストの幅 */
  drawerWidth: z.number(),
  /** NgrokのToken */
  ngrokToken: z.string().optional(),
  /** 画面の表示形式を list or card で選択 */
  viewStyle: ViewStyleSetting,
});
export type SystemUserSetting = z.infer<typeof SystemUserSetting>;

export const WorldContainerSetting = z.object({
  container: WorldContainer,
  visible: z.boolean(),
  name: z.string(),
});
export type WorldContainerSetting = z.infer<typeof WorldContainerSetting>;

/**
 * GetWorldContainersの戻り値
 * SetWorldContainersの引数
 */
export const WorldContainers = z.array(WorldContainerSetting);
export type WorldContainers = z.infer<typeof WorldContainers>;

export const SystemPlayerSetting = z.object({
  groups: z.record(PlayerGroup),
  players: z.array(PlayerUUID),
});
export type SystemPlayerSetting = z.infer<typeof SystemPlayerSetting>;

export const SystemRemoteSetting = z.array(RemoteSetting);
export type SystemRemoteSetting = z.infer<typeof SystemRemoteSetting>;
