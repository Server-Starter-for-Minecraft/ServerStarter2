import { z } from 'zod';
import { ImageURI, PlayerUUID } from './brands';

/** システムのプレイヤー設定 */
export const Player = z.object({
  /** プレイヤー名 */
  name: z.string(),
  /** プレイヤーのUUID */
  uuid: PlayerUUID,
  /** プレイヤースキンの顔部分の画像 */
  avatar: ImageURI,
  /** プレイヤースキンの顔部分の外側レイヤーの画像 */
  avatar_overlay: ImageURI,
});
export type Player = z.infer<typeof Player>;

/** システムのプレイヤーグループ設定 */
export const PlayerGroup = z.object({
  /** グループ名 */
  name: z.string(),
  /** グループのカラー(#入りコード) */
  color: z.string().default('#FFFFFF'),
  /** 所属するプレイヤーのUUIDのリスト */
  players: z.array(PlayerUUID).default([]),
});
export type PlayerGroup = z.infer<typeof PlayerGroup>;

/** ワールドごとのプレイヤーOPの権限レベル */
export const OpLevel = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type OpLevel = z.infer<typeof OpLevel>;

export const OpSetting = z.object({
  level: OpLevel,
  bypassesPlayerLimit: z.boolean().default(false),
});
export type OpSetting = z.infer<typeof OpSetting>;

/** ワールドごとのプレイヤー設定 */
export const PlayerSetting = z.object({
  /** プレイヤーのUUID */
  uuid: PlayerUUID,
  /** プレイヤー名 */
  name: z.string(),
  /** プレイヤーのop権限レベル */
  op: OpSetting.optional(),
});
export type PlayerSetting = z.infer<typeof PlayerSetting>;
