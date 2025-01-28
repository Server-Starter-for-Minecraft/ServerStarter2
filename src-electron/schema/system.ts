import { z } from 'zod';
import { PlayerUUID, UUID, WorldContainer } from './brands';
import { PlayerGroup } from './player';
import { RemoteSetting } from './remote';
import { SystemWorldSettings } from './world';

export const locales = ['ja', 'en-US'] as const;
/** 言語 */
export const Locale = z.enum(locales).default('ja');
export type Locale = z.infer<typeof Locale>;

export const colorThemes = ['light', 'auto', 'dark'] as const;
export const ColorTheme = z.enum(colorThemes).default('auto');
export type ColorTheme = z.infer<typeof ColorTheme>;

export const SystemSystemSetting = z
  .object({
    // 最終アップデート時刻
    lastUpdatedTime: z.number().optional(),
  })
  .default({});
export type SystemSystemSetting = z.infer<typeof SystemSystemSetting>;

export const ViewStyleSetting = z
  .object({
    /** プレイヤータブ */
    player: z.enum(['list', 'card']).default('list'),
    /** 追加コンテンツタブ */
    contents: z.enum(['list', 'card']).default('list'),
  })
  .default({});
export type ViewStyleSetting = z.infer<typeof ViewStyleSetting>;

export const SystemUserSetting = z
  .object({
    /** ServerStarterの利用規約同意状況 */
    eula: z.boolean().default(false),
    /** カラーテーマ Light/Dark */
    theme: ColorTheme,
    /** 色覚サポート */
    visionSupport: z.boolean().default(false),
    /** システム言語 */
    language: Locale,
    /** 実行者情報 */
    owner: PlayerUUID.optional(),
    /** 実行環境ID(特に変更の必要なし) */
    id: UUID.default('00000000-0000-0000-0000-000000000000'),
    /** 自動シャットダウン */
    autoShutDown: z.boolean().default(false),
    /** ワールドリストの幅 */
    drawerWidth: z.number().default(300),
    /** NgrokのToken */
    ngrokToken: z.string().optional(),
    /** 画面の表示形式を list or card で選択 */
    viewStyle: ViewStyleSetting,
  })
  .default({});
export type SystemUserSetting = z.infer<typeof SystemUserSetting>;

export const WorldContainerSetting = z
  .object({
    container: WorldContainer.default('servers'),
    visible: z.boolean().default(true),
    name: z.string().default('default'),
  })
  .default({});
export type WorldContainerSetting = z.infer<typeof WorldContainerSetting>;

/**
 * GetWorldContainersの戻り値
 * SetWorldContainersの引数
 */
export const WorldContainers = WorldContainerSetting.array().default([
  WorldContainerSetting.parse({}),
]);
export type WorldContainers = z.infer<typeof WorldContainers>;

export const SystemPlayerSetting = z
  .object({
    groups: z.record(PlayerGroup).default({}),
    players: z.array(PlayerUUID).default([]),
  })
  .default({});
export type SystemPlayerSetting = z.infer<typeof SystemPlayerSetting>;

export const SystemRemoteSetting = z.array(RemoteSetting).default([]);
export type SystemRemoteSetting = z.infer<typeof SystemRemoteSetting>;

/** システム設定まとめてここに格納 */
export const SystemSettings = z.object({
  container: WorldContainers,
  world: SystemWorldSettings,
  remote: SystemRemoteSetting,
  player: SystemPlayerSetting,
  user: SystemUserSetting,

  // /** 基本的にはフロントから編集不可の定数 */
  system: SystemSystemSetting,
});
export type SystemSettings = z.infer<typeof SystemSettings>;
