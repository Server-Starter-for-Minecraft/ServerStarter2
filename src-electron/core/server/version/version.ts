import { Version, VersionType } from 'app/src-electron/api/scheme';
import { vanillaVersionLoader } from './vanilla';
import { VersionLoader } from './interface';
import { spigotVersionLoader } from './spigot';
import { papermcVersionLoader } from './papermc';
import { forgeVersionLoader } from './forge';
import { mohistmcVersionLoader } from './mohistmc';

export const versionLoaders: {
  [key in VersionType]: VersionLoader | undefined;
} = {
  vanilla: vanillaVersionLoader,
  spigot: spigotVersionLoader,
  papermc: papermcVersionLoader,
  forge: forgeVersionLoader,
  mohistmc: mohistmcVersionLoader,
};

// 指定されたバージョンを準備する
export async function readyVersion(version: Version) {
  const loader = versionLoaders[version.type];
  if (!loader) {
    throw new Error(`unknown version type ${version.type}`);
  }
  return await loader.readyVersion(version);
}

// 指定されたバージョンを準備する
export async function getVersions(type: VersionType) {
  const loader = versionLoaders[type];
  if (!loader) {
    throw new Error(`unknown version type ${type}`);
  }
  return await loader.getAllVersions();
}
