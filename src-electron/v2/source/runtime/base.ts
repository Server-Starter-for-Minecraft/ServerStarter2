import { z } from 'zod';
import { OsPlatform } from '../../schema/os';
import { Runtime } from '../../schema/runtime';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

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
  ): Promise<Result<RuntimeMeta>>;

  /** 各ランタイムのインストール先のパスを返す */
  getInstallPath(
    /** cache/runtime/bin/[RuntimeType] */
    installBasePath: Path,
    runtime: R,
    osPlatform: OsPlatform
  ): Path;
};
