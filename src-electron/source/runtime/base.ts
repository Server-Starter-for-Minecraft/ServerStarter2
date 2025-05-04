import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { OsPlatform } from 'app/src-electron/schema/os';
import { Runtime } from 'app/src-electron/schema/runtime';
import { Path } from 'app/src-electron/util/binary/path';

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

export type RuntimeInstaller<R extends Runtime> = {
  install(
    installPath: Path,
    runtime: R,
    osPlatform: OsPlatform
  ): Promise<Failable<RuntimeMeta>>;
};
