import { z } from 'zod';
import {
  DATAPACK_CACHE_PATH,
  logDir,
  MOD_CACHE_PATH,
  PLUGIN_CACHE_PATH,
} from '../source/const';
import {
  DefaultServerPropertiesAnnotation,
  ServerPropertiesAnnotation,
} from './serverproperty';

/**
 * プレイヤーグループの配色に用いるMinecraftの染料の16色（キーは染料・羊毛の画像の名前と一致する）
 *
 * 色コードはMinecraftの染料の色（DyeColor）に合わせる。並び順はクリエイティブインベントリの順とする
 */
export const MinecraftColors = z
  .object({
    white: z.string().default('#F9FFFE'),
    light_gray: z.string().default('#9D9D97'),
    gray: z.string().default('#474F52'),
    black: z.string().default('#1D1D21'),
    brown: z.string().default('#835432'),
    red: z.string().default('#B02E26'),
    orange: z.string().default('#F9801D'),
    yellow: z.string().default('#FED83D'),
    lime: z.string().default('#80C71F'),
    green: z.string().default('#5E7C16'),
    cyan: z.string().default('#169C9C'),
    light_blue: z.string().default('#3AB3DA'),
    blue: z.string().default('#3C44AA'),
    purple: z.string().default('#8932B8'),
    magenta: z.string().default('#C74EBD'),
    pink: z.string().default('#F38BAA'),
  })
  .prefault({});
export type MinecraftColors = z.infer<typeof MinecraftColors>;

export const StaticResouce = z.object({
  properties: ServerPropertiesAnnotation.default(
    DefaultServerPropertiesAnnotation
  ),
  minecraftColors: MinecraftColors,
  paths: z
    .object({
      log: z.string().default(logDir.str()),
      cache: z
        .object({
          datapack: z.string().default(DATAPACK_CACHE_PATH.str()),
          plugin: z.string().default(PLUGIN_CACHE_PATH.str()),
          mod: z.string().default(MOD_CACHE_PATH.str()),
        })
        .prefault({}),
    })
    .prefault({}),
});
export type StaticResouce = z.infer<typeof StaticResouce>;
