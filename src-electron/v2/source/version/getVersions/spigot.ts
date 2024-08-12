import * as cheerio from 'cheerio';
import { ok } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { AllSpigotVersion, VersionId } from '../../../schema/version';
import { VersionListLoader } from './base';
import { getVersionMainfest } from './mainfest';

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
export class SpigotVersionLoader extends VersionListLoader<AllSpigotVersion> {
  constructor(cachePath: Path) {
    super(cachePath, 'spigot', AllSpigotVersion);
  }

  async getFromURL() {
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
    this.sortIds(ids);

    return ok(
      ids
        .filter((id) => !REMOVE_VERSIONS.includes(id))
        .map((id) => ({
          id: id as VersionId,
        }))
    );
  }

  /**
   * HTMLから取得したID一覧をManifestに掲載の順番で並び替える
   */
  private async sortIds(ids: string[]) {
    const manifest = await getVersionMainfest(this.cachePath, true);
    if (manifest.isErr) return manifest;

    // Manifest掲載のバージョン順を取得
    const entries: [string, number][] = manifest
      .value()
      .versions.map((version, index) => [version.id, index]);
    const versionIndexMap = Object.fromEntries(entries);

    // 取得したバージョン順で`ids`を並び替え
    ids.sort((a, b) => versionIndexMap[a] - versionIndexMap[b]);
  }
}
