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
  [key in VersionType]: VersionLoader;
} = {
  vanilla: vanillaVersionLoader,
  spigot: spigotVersionLoader,
  papermc: papermcVersionLoader,
  forge: forgeVersionLoader,
  mohistmc: mohistmcVersionLoader,
  fabric: fabricVersionLoader,
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
export async function getVersions(type: VersionType, useCache: boolean) {
  const loader = versionLoaders[type];
  if (!loader) {
    throw new Error(`unknown version type ${type}`);
  }
  return await loader.getAllVersions(useCache);
}

// LevelNameを取得する
export async function defineLevelName(
  type: VersionType,
  worldPath: Path,
  serverCwdPath: Path
) {
  const loader = versionLoaders[type];
  if (!loader) {
    throw new Error(`unknown version type ${type}`);
  }
  return await loader.defineLevelName(worldPath, serverCwdPath);
}
