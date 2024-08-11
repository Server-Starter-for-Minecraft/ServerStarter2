import { ok } from 'app/src-electron/v2/util/base';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { AllVanillaVersion } from '../../../schema/version';
import { VersionListLoader } from './base';
import { getVersionMainfest } from './mainfest';

/**
 * バニラ版のVersionLoaderを作成
 */
export class VanillaVersionLoader extends VersionListLoader<AllVanillaVersion> {
  constructor(cachePath: Path) {
    super(cachePath, 'vanilla', AllVanillaVersion);
  }
  async getFromURL() {
    const manifest = await getVersionMainfest(this.cachePath, false);
    if (manifest.isErr) return manifest;

    // 1.2.5以前はマルチサーバーが存在しない
    const lastindex = manifest
      .value()
      .versions.findIndex((x) => x.id === '1.2.5');
    const multiPlayableVersions = manifest.value().versions.slice(0, lastindex);

    return ok(
      multiPlayableVersions.map((x) => ({
        id: x.id,
        release: x.type === 'release',
      }))
    );
  }
}
