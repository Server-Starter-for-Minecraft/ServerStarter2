import { z } from 'zod';
import { formatUUID } from '../util/random/uuid';

/** UUID文字列 ( 00000000-0000-0000-0000-000000000000 の形にフォーマットされた文字列) */
export const UUID = z
  .preprocess((val) => {
    if (typeof val === 'string') {
      return formatUUID(val);
    } else {
      return val;
    }
  }, z.string().uuid())
  .brand('UUID');
export type UUID = z.infer<typeof UUID>;

/** ワールドコンテナの名前文字列 */
export const WorldContainer = z.string().brand('WorldContainer');
export type WorldContainer = z.infer<typeof WorldContainer>;

/** ワールドの名前文字列 */
export const WorldName = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .brand('WorldName');
export type WorldName = z.infer<typeof WorldName>;

/** プレイヤーのUUID文字列 */
export const PlayerUUID = z
  .preprocess((val) => {
    if (typeof val === 'string') {
      return formatUUID(val);
    } else {
      return val;
    }
  }, z.string().uuid())
  .brand('PlayerUUID');
export type PlayerUUID = z.infer<typeof PlayerUUID>;

/** 画像のuri文字列 <img src={ここに挿入可能}> */
export const ImageURI = z.string().brand('ImageURI');
export type ImageURI = z.infer<typeof ImageURI>;

/** 1970年1月1日00:00:00 UTCからの経過時間(ミリ秒) */
export const Timestamp = z.number().brand('Timestamp');
export type Timestamp = z.infer<typeof Timestamp>;

/** リモートワールドの名前文字列 */
export const RemoteWorldName = z.string().brand('RemoteWorldName');
export type RemoteWorldName = z.infer<typeof RemoteWorldName>;

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('uuid parse', () => {
    const formattedUUID = '00000000-0000-0000-0000-000000000000';
    const unFormattedUUID = '00000000000000000000000000000000';
    const invalidUUID = 'invalid UUID';

    expect(PlayerUUID.safeParse(formattedUUID).success).toBe(true);
    expect(PlayerUUID.safeParse(unFormattedUUID).success).toBe(true);
    expect(PlayerUUID.safeParse(invalidUUID).success).toBe(false);
  });
}
