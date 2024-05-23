import {
  FabricVersion,
  ForgeVersion,
  MohistmcVersion,
  PapermcVersion,
  SpigotVersion,
  VanillaVersion,
  Version,
  VersionType,
  versionTypes,
} from 'app/src-electron/schema/version';
import {
  booleanFixer,
  FAIL,
  Fixer,
  literalFixer,
  numberFixer,
  objectFixer,
  optionalFixer,
  stringFixer,
  unionFixer,
} from 'app/src-electron/util/detaFixer/fixer';

export const fixVersionType = literalFixer<VersionType>(versionTypes);

export const fixVanillaVersion = objectFixer<VanillaVersion>(
  {
    id: stringFixer(),
    type: literalFixer(['vanilla']),
    release: booleanFixer(),
  },
  false
);
export const fixSpigotVersion = objectFixer<SpigotVersion>(
  { id: stringFixer(), type: literalFixer(['spigot']) },
  false
);
export const fixPapermcVersion = objectFixer<PapermcVersion>(
  { id: stringFixer(), type: literalFixer(['papermc']), build: numberFixer() },
  false
);
export const fixForgeVersion = objectFixer<ForgeVersion>(
  {
    id: stringFixer(),
    type: literalFixer(['forge']),
    forge_version: stringFixer(),
    download_url: stringFixer(),
  },
  false
);

export const fixMohistmcVersion = objectFixer<MohistmcVersion>(
  {
    id: stringFixer(),
    type: literalFixer(['mohistmc']),
    forge_version: optionalFixer(stringFixer()),
    number: numberFixer(),
  },
  false
);

export const fixFabricVersion = objectFixer<FabricVersion>(
  {
    id: stringFixer(),
    type: literalFixer(['fabric']),
    release: booleanFixer(),
    loader: stringFixer(),
    installer: stringFixer(),
  },
  false
);

export const fixVersion: Fixer<Version | FAIL> = unionFixer(
  fixVanillaVersion,
  fixSpigotVersion,
  fixPapermcVersion,
  fixForgeVersion,
  fixMohistmcVersion,
  fixFabricVersion
);
