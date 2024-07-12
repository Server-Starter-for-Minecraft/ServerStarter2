import * as cheerio from 'cheerio';
import { z } from 'zod';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { AllSpigotVersion, VersionId } from '../../../schema/version';
import {
  getFromCacheBase,
  getVersionCacheFilePath,
  VersionListLoader,
} from './base';
import { getVersionMainfest } from './mainfest';

const spigotVerZod = z.object({
  id: z.string().transform((ver) => ver as VersionId),
});

/**
 * Spigotにおける`all.json`を定義
 */
const allSpigotsHandler = JsonSourceHandler.fromPath<AllSpigotVersion>(
  getVersionCacheFilePath('spigot'),
  spigotVerZod.array()
);

const SPIGOT_VERSIONS_URL = 'https://hub.spigotmc.org/versions/';

/**
 * Spigotのビルドに失敗するバージョンは一覧から除外する
 *
 * - `1.20` 1.20を指定しても1.20.1がビルドされてしまう
 */
const REMOVE_VERSIONS = ['1.20'];

/**
 * Spigot版のVersionLoaderを作成
 */
export function getSpigotVersionLoader(): VersionListLoader<AllSpigotVersion> {
  return {
    getFromCache: () => getFromCacheBase('spigot', allSpigotsHandler),
    getFromURL: async (): Promise<Result<AllSpigotVersion>> => {
      const pageHtml = (await new Url(SPIGOT_VERSIONS_URL).into(Bytes)).onOk(
        (val) => val.toStr()
      );
      if (pageHtml.isErr) return pageHtml;

      const ids: string[] = [];

      cheerio
        .load(pageHtml.value())('body > pre > a')
        .each((_, elem) => {
          const href = elem.attribs['href'];
          const match = href.match(/^(\d+\.\d+(?:\.\d+)?)\.json$/);
          if (match) {
            ids.push(match[1]);
          }
        });

      // idsをバージョン順に並び替え
      sortIds(ids);

      return ok(
        ids
          .filter((id) => !REMOVE_VERSIONS.includes(id))
          .map((id) => ({
            id: id as VersionId,
          }))
      );
    },
    write4Cache: (obj) => {
      return allSpigotsHandler.write(obj);
    },
  };
}

/**
 * HTMLから取得したID一覧をManifestに掲載の順番で並び替える
 */
async function sortIds(ids: string[]) {
  const manifest = await getVersionMainfest(true);
  if (manifest.isErr) return manifest;

  // Manifest掲載のバージョン順を取得
  const entries: [string, number][] = manifest
    .value()
    .versions.map((version, index) => [version.id, index]);
  const versionIndexMap = Object.fromEntries(entries);

  // 取得したバージョン順で`ids`を並び替え
  ids.sort((a, b) => versionIndexMap[a] - versionIndexMap[b]);
}
