import { z } from 'zod';
import {
  DATAPACK_CACHE_PATH,
  logPath,
  MOD_CACHE_PATH,
  PLUGIN_CACHE_PATH,
} from '../source/const';
import {
  DefaultServerPropertiesAnnotation,
  ServerPropertiesAnnotation,
} from './serverproperty';

export const MinecraftColors = z
  .object({
    dark_red: z.string().default('#AA0000'),
    red: z.string().default('#FF5555'),
    gold: z.string().default('#FFAA00'),
    yellow: z.string().default('#FFFF55'),
    dark_green: z.string().default('#00AA00'),
    green: z.string().default('#55FF55'),
    aqua: z.string().default('#55FFFF'),
    dark_aqua: z.string().default('#00AAAA'),
    dark_blue: z.string().default('#0000AA'),
    blue: z.string().default('#5555FF'),
    light_purple: z.string().default('#FF55FF'),
    dark_purple: z.string().default('#AA00AA'),
    white: z.string().default('#FFFFFF'),
    gray: z.string().default('#AAAAAA'),
    dark_gray: z.string().default('#555555'),
    black: z.string().default('#000000'),
  })
  .default({});
export type MinecraftColors = z.infer<typeof MinecraftColors>;

export const StaticResouce = z.object({
  properties: ServerPropertiesAnnotation.default(
    DefaultServerPropertiesAnnotation
  ),
  minecraftColors: MinecraftColors,
  paths: z
    .object({
      log: z.string().default(logPath.str()),
      cache: z
        .object({
          datapack: z.string().default(DATAPACK_CACHE_PATH.str()),
          plugin: z.string().default(PLUGIN_CACHE_PATH.str()),
          mod: z.string().default(MOD_CACHE_PATH.str()),
        })
        .default({}),
    })
    .default({}),
});
export type StaticResouce = z.infer<typeof StaticResouce>;
