import { AllVersion, Version, VersionType } from 'src-electron/schema/version';
import { Failable } from 'app/src-electron/schema/error';
import { Path } from '../../util/path';
import { GroupProgressor } from '../progress/progress';
import { VersionLoader } from './base';
import { fabricVersionLoader } from './fabric';
import { forgeVersionLoader } from './forge';
import { mohistmcVersionLoader } from './mohistmc';
import { papermcVersionLoader } from './papermc';
import { spigotVersionLoader } from './spigot';
import { vanillaVersionLoader } from './vanilla';

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
  cwdPath: Path,
  progress?: GroupProgressor
) {
  const loader: VersionLoader<V> = versionLoaders[
    version.type
  ] as VersionLoader<V>;
  return await loader.readyVersion(version, cwdPath, progress);
}

// 指定されたバージョンを準備する
export async function getVersions<V extends VersionType>(
  type: V,
  useCache: boolean
): Promise<Failable<AllVersion<V>>> {
  const loader = versionLoaders[type];
  if (!loader) {
    throw new Error(`unknown version type ${type}`);
  }
  const all = (await loader.getAllVersions(useCache)) as AllVersion<V>;
  return all;
}

/** サーバーの起動にeulaが必要かどうか */
export function needEulaAgreement<V extends Version>(version: V) {
  const loader = versionLoaders[version.type] as VersionLoader<V>;
  if (!loader) {
    throw new Error(`unknown version type ${version.type}`);
  }
  return loader.needEulaAgreement(version);
}
