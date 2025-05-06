import { z } from 'zod';

export const RuntimeMeta = z.object({
  /** アンインストール時にこのパスを丸ごと消せばOK */
  base: z.object({
    /** ServerStarterの実行パスからの相対パス or 絶対パス */
    path: z.string(),
  }),
  javaw: z.object({
    /** ServerStarterの実行パスからの相対パス or 絶対パス */
    path: z.string(),
    sha1: z.string(),
  }),
  java: z.object({ path: z.string(), sha1: z.string() }),
});
export type RuntimeMeta = z.infer<typeof RuntimeMeta>;
