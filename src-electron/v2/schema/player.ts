import { z } from 'zod';

export const PlayerUUID = z.string().uuid().brand('PlayerUUID');
export type PlayerUUID = z.infer<typeof PlayerUUID>;

export const PlayerName = z
  .string()
  .regex(/^[a-zA-Z0-9_]{2,16}$/)
  .brand('PlayerName');
export type PlayerName = z.infer<typeof PlayerName>;

export const ImageURI = z
  .string()
  .regex(/^data:image\/png;base64,/)
  .brand('ImageURI');
export type ImageURI = z.infer<typeof ImageURI>;

export const Player = z.object({
  uuid: PlayerUUID,
  name: PlayerName,
});
export type Player = z.infer<typeof Player>;

export const OpLevel = z
  .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
  .brand('OpLevel');
export type OpLevel = z.infer<typeof OpLevel>;

export const PlayerAvatar = Player.extend({
  /** プレイヤースキンの顔部分の画像 */
  avatar: ImageURI,
  /** プレイヤースキンの顔部分の外側レイヤーの画像 */
  avatar_overlay: ImageURI,
});
export type PlayerAvatar = z.infer<typeof PlayerAvatar>;
