import { z } from 'zod';
import { ok } from 'app/src-electron/v2/util/base';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { AllVanillaVersion, VersionId } from '../../../schema/version';
import {
  getFromCacheBase,
  getVersionCacheFilePath,
  VersionListLoader,
} from './base';
import { getVersionMainfest } from './mainfest';

const vanillaVerZod = z.object({
  id: z.string().transform((ver) => ver as VersionId),
  release: z.boolean(),
});

/**
 * バニラにおける`all.json`を定義
 */
const allVanillasHandler = JsonSourceHandler.fromPath<AllVanillaVersion>(
  getVersionCacheFilePath('vanilla'),
  vanillaVerZod.array()
);

/**
 * バニラ版のVersionLoaderを作成
 */
export function getVanillaVersionLoader(): VersionListLoader<AllVanillaVersion> {
  return {
    getFromCache: () => getFromCacheBase('vanilla', allVanillasHandler),
    getFromURL: async () => {
      const manifest = await getVersionMainfest(false);
      if (manifest.isErr) return manifest;

      // 1.2.5以前はマルチサーバーが存在しない
      const lastindex = manifest
        .value()
        .versions.findIndex((x) => x.id === '1.2.5');
      const multiPlayableVersions = manifest
        .value()
        .versions.slice(0, lastindex);

      return ok(
        multiPlayableVersions.map((x) => ({
          id: x.id,
          release: x.type === 'release',
        }))
      );
    },
    write4Cache: (obj) => {
      return allVanillasHandler.write(obj);
    },
  };
}