import { ForgeVersion } from 'app/src-electron/api/scheme';
import { VersionLoader } from './interface';
import { Failable, isFailure } from '../../utils/result';
import { Path } from '../../utils/path/path';
import { JavaComponent } from './vanilla';
import { BytesData } from '../../utils/bytesData/bytesData';
import * as cheerio from 'cheerio';

const ForgeURL = 'https://files.minecraftforge.net/net/minecraftforge/forge/';

export const papermcVersionLoader: VersionLoader = {
  /** forgeのサーバーデータをダウンロード */
  async readyVersion(
    version: ForgeVersion
  ): Promise<Failable<{ jarpath: Path; component: JavaComponent }>> {
    version.id;
  },
};

export async function getForgeDownloadUrl(version: ForgeVersion) {
  const PageURL =
    'https://files.minecraftforge.net/net/minecraftforge/forge/index_' +
    version.id +
    '.html';
  const Page = await BytesData.fromURL(PageURL);
  if (isFailure(Page)) return Page;

  const $ = cheerio.load(await Page.text());

  const AdURL = $('a[title=Installer]').last().attr('href');

  if (AdURL === undefined) {
    console.log($('div.download a').length, version.id);
    return new Error(`failed to fetch forge download URL (${version.id})`);
  }

  const match = AdURL.match(
    /^https:\/\/adfoc.us\/serve\/sitelinks\/\?id=\d+&url=([a-z0-9:\/\._-]+)$/
  );
  if (!match) return new Error(`failed to parse forge download URL (${AdURL})`);

  const url = match[1];

  return url;
}

export async function getVersionIds() {
  const indexPage = await BytesData.fromURL(ForgeURL);

  if (isFailure(indexPage)) return indexPage;

  const $ = cheerio.load(await indexPage.text());

  const ids: string[] = [];

  // TODO: Forgeのhtml構成が変わった瞬間終わるので対策を考えたい
  $('ul.section-content li.li-version-list ul li a').each((_, elem) => {
    const path = elem.attribs['href'];
    const match = path.match(/^index_([a-z0-9_\.-]+)\.html$/);
    console.group(path, match);
    if (match) ids.push(match[1]);
  });
  console.log(ids);

  return ids;
}
