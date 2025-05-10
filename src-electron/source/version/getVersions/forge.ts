import * as cheerio from 'cheerio';
import { Failable } from 'app/src-electron/schema/error';
import { AllForgeVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { VersionListLoader } from './base';

const ForgeURL = 'https://files.minecraftforge.net/net/minecraftforge/forge/';

/**
 * Forge版のVersionLoaderを作成
 */
export class ForgeVersionLoader extends VersionListLoader<'forge'> {
  constructor(cachePath: Path) {
    super(cachePath, 'forge', AllForgeVersion);
  }
  async getFromURL(): Promise<Failable<AllForgeVersion>> {
    const indexPage = await BytesData.fromURL(ForgeURL);
    if (isError(indexPage)) return indexPage;

    const $ = cheerio.load(await indexPage.text());

    const ids: VersionId[] = [];

    // TODO: Forgeのhtml構成が変わった瞬間終わるので対策を考えたい
    $('ul.section-content li.li-version-list ul li a').each((_, elem) => {
      const path = elem.attribs['href'];
      const match = path.match(/^index_([a-z0-9_\.-]+)\.html$/);
      if (match) ids.push(match[1] as VersionId);
    });

    // 各バージョンごとの全ビルドを並列取得してflat化
    const versions = (await Promise.all(ids.map(scrapeForgeVersions))).filter(
      isValid
    );

    return versions;
  }
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
): Promise<Failable<AllForgeVersion[number]>> {
  if (noInstallerVersionIds.has(id))
    return errorMessage.core.version.forgeInstallerNotProvided({
      version: id,
    });

  const versionUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/index_${id}.html`;
  const page = await BytesData.fromURL(versionUrl);
  if (isError(page)) return page;

  const forge_versions: { version: string; url: string }[] = [];

  const $ = cheerio.load(await page.text());
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

  return { id, forge_versions, recommended };
}
