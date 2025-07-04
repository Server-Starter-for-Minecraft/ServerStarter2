import * as cheerio from 'cheerio';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { AllSpigotVersion, VersionId } from '../../../schema/version';
import { VersionListLoader } from './base';

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
export class SpigotVersionLoader extends VersionListLoader<'spigot'> {
  constructor(cachePath: Path) {
    super(cachePath, 'spigot', AllSpigotVersion);
  }

  async getFromURL() {
    const pageBytes = await BytesData.fromURL(SPIGOT_VERSIONS_URL);
    if (isError(pageBytes)) return pageBytes;

    const ids: string[] = [];

    cheerio
      .load(await pageBytes.text())('body > pre > a')
      .each((_, elem) => {
        const href = elem.attribs['href'];
        const match = href.match(/^(\d+\.\d+(?:\.\d+)?)\.json$/);
        if (match) {
          ids.push(match[1]);
        }
      });

    // idsをバージョン順に並び替え
    await this.sortIds(ids);

    return ids
      .filter((id) => !REMOVE_VERSIONS.includes(id))
      .map((id) => ({
        id: id as VersionId,
      }));
  }
}
