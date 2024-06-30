import {
  AllFabricVersion,
  AllForgeVersion,
  AllMohistmcVersion,
  AllPapermcVersion,
  AllSpigotVersion,
  AllVanillaVersion,
} from '../../../schema/version';
import { Result } from '../../../util/base';

type AllVerison =
  | AllVanillaVersion
  | AllSpigotVersion
  | AllPapermcVersion
  | AllForgeVersion
  | AllMohistmcVersion
  | AllFabricVersion;

export interface VersionListLoader<T extends AllVerison> {
  getFromCache: () => Promise<Result<T>>;
  getFromURL: () => Promise<Result<T>>;
}

export function getVersionlist<T extends AllVerison>(
  useCache: boolean,
  loader: VersionListLoader<T>
) {
  if (useCache) {
    return loader.getFromCache();
  } else {
    return loader.getFromURL();
  }
}
