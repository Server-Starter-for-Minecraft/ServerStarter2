import { Version, VersionType } from 'app/src-electron/api/scheme';
import { vanillaVersionLoader } from './vanilla';
import { VersionLoader } from './base';
import { spigotVersionLoader } from './spigot';
import { papermcVersionLoader } from './papermc';
import { forgeVersionLoader } from './forge';
import { mohistmcVersionLoader } from './mohistmc';
import { Path } from '../../utils/path/path';
import { fabricVersionLoader } from './fabric';

export const versionLoaders: {
  [V in Version as V['type']]: VersionLoader<V>;
} = {
  vanilla: vanillaVersionLoader,
  spigot: spigotVersionLoader,
  papermc: papermcVersionLoader,
  forge: forgeVersionLoader,
  mohistmc: mohistmcVersionLoader,
  fabric: fabricVersionLoader,
};

// 指定されたバージョンを準備する
export async function readyVersion<V extends Version>(
  version: V,
  cwdPath: Path
) {
  const loader: VersionLoader<V> = versionLoaders[
    version.type
  ] as VersionLoader<V>;
  return await loader.readyVersion(version, cwdPath);
}

// 指定されたバージョンを準備する
export async function getVersions(type: VersionType, useCache: boolean) {
  const loader = versionLoaders[type];
  if (!loader) {
    throw new Error(`unknown version type ${type}`);
  }
  return await loader.getAllVersions(useCache);
}
