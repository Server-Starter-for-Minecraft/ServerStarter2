import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { AllVanillaVersion } from '../../../schema/version';
import { VersionListLoader } from './base';
import { getVersionMainfest } from './manifest';

/**
 * バニラ版のVersionLoaderを作成
 */
export class VanillaVersionLoader extends VersionListLoader<'vanilla'> {
  constructor(cachePath: Path) {
    super(cachePath, 'vanilla', AllVanillaVersion);
  }
  async getFromURL() {
    const manifest = await getVersionMainfest(this.cachePath, false);
    if (isError(manifest)) return manifest;

    // 1.2.5以前はマルチサーバーが存在しない
    const lastindex = manifest.versions.findIndex((x) => x.id === '1.2.5');
    const multiPlayableVersions = manifest.versions.slice(0, lastindex);

    return multiPlayableVersions.map((x) => ({
      id: x.id,
      release: x.type === 'release',
    }));
  }
}
