import * as cheerio from 'cheerio';
import { z } from 'zod';
import { AllForgeVersion, VersionId } from 'app/src-electron/v2/schema/version';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import {
  getFromCacheBase,
  getVersionCacheFilePath,
  VersionListLoader,
} from './base';

const forgeVerZod = z.object({
  id: z.string().transform((ver) => ver as VersionId),
  forge_versions: z
    .object({
      version: z.string(),
      url: z.string(),
    })
    .array(),
  recommended: z
    .object({
      version: z.string(),
      url: z.string(),
    })
    .optional(),
});

/**
 * Forgeにおける`all.json`を定義
 */
const allForgesHandler = JsonSourceHandler.fromPath<AllForgeVersion>(
  getVersionCacheFilePath('forge'),
  forgeVerZod.array()
);

const ForgeURL = 'https://files.minecraftforge.net/net/minecraftforge/forge/';

/**
 * Forge版のVersionLoaderを作成
 */
export function getForgeVersionLoader(): VersionListLoader<AllForgeVersion> {
  return {
    getFromCache: () => getFromCacheBase('forge', allForgesHandler),
    getFromURL: async (): Promise<Result<AllForgeVersion>> => {
      const indexPage = (await new Url(ForgeURL).into(Bytes)).onOk((v) =>
        v.toStr()
      );
      if (indexPage.isErr) return indexPage;

      const $ = cheerio.load(indexPage.value());

      const ids: VersionId[] = [];

      // TODO: Forgeのhtml構成が変わった瞬間終わるので対策を考えたい
      $('ul.section-content li.li-version-list ul li a').each((_, elem) => {
        const path = elem.attribs['href'];
        const match = path.match(/^index_([a-z0-9_\.-]+)\.html$/);
        if (match) ids.push(match[1] as VersionId);
      });

      // 各バージョンごとの全ビルドを並列取得してflat化
      const versions = (await Promise.all(ids.map(scrapeForgeVersions)))
        .filter((ver) => ver.isOk)
        .map((ver) => ver.value());
      
      return ok(versions);
    },
    write4Cache: (obj) => {
      return allForgesHandler.write(obj);
    },
  };
}

const noInstallerVersionIds = new Set([
  '1.5.1',
  '1.5',
  '1.4.7',
  '1.4.6',
  '1.4.5',
  '1.4.4',
  '1.4.3',
  '1.4.2',
  '1.4.1',
  '1.4.0',
  '1.3.2',
  '1.2.5',
  '1.2.4',
  '1.2.3',
  '1.1',
]);

export async function scrapeForgeVersions(
  id: VersionId
): Promise<Result<AllForgeVersion[number]>> {
  if (noInstallerVersionIds.has(id))
    return err(new Error(`FORGE_INSTALLER_NOT_PROVIDED_(VER_${id})`));

  const versionUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/index_${id}.html`;
  const page = (await new Url(versionUrl).into(Bytes)).onOk((v) => v.toStr());
  if (page.isErr) return page;

  const forge_versions: { version: string; url: string }[] = [];

  const $ = cheerio.load(page.value());
  $('.download-list > tbody > tr').each((_, elem) => {
    const downloadVersion = $('.download-version', elem);

    downloadVersion.children();
    // 子要素を消して直接のテキストだけを取得
    downloadVersion.children().remove();
    const version = downloadVersion.text().trim();

    const url = $('.download-links > li', elem)
      .map((_, x) => {
        const children = $(x).children();

        const isInstaller = children.first().text().trim() === 'Installer';

        if (!isInstaller) return;

        return children.children().last().attr()?.href;
      })
      .filter((x) => x !== undefined)[0];

    if (version && url) {
      forge_versions.push({
        version,
        url,
      });
    }
  });

  // recommendedを取得
  let recommended: { version: string; url: string } | undefined = undefined;

  $('div.downloads > div.download > div.title > small').each((i, elem) => {
    if (i !== 1) return;

    const element = $(elem);
    // 子要素を消して直接のテキストだけを取得
    const path = element.text();

    if (typeof path !== 'string') return;
    const match = path.match(/^[\d\.]+ - (.+)$/);
    if (match === null) return;
    const reco = match[1];
    recommended = forge_versions.find((x) => x.version === reco);
  });

  return ok({
    id,
    forge_versions,
    recommended,
  });
}
