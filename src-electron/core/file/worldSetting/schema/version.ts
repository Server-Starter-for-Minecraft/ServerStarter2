import { fixConst } from '../../base/fixer/const';
import { fixObject } from '../../base/fixer/object';
import { fixBoolean, fixNumber, fixString } from '../../base/fixer/primitive';
import { fixUnion } from '../../base/fixer/union';

export type VersionType$1 =
  | 'vanilla'
  | 'spigot'
  | 'papermc'
  | 'forge'
  | 'mohistmc'
  | 'fabric';

export const VersionType$1 = fixConst<VersionType$1>(
  'vanilla',
  'spigot',
  'papermc',
  'forge',
  'mohistmc',
  'fabric'
);

export type VanillaVersion$1 = {
  id: string;
  type: 'vanilla';
  release: boolean;
};
export const VanillaVersion$1 = fixObject<VanillaVersion$1>({
  id: fixString,
  type: fixConst('vanilla'),
  release: fixBoolean,
});

export type SpigotVersion$1 = { id: string; type: 'spigot' };
export const SpigotVersion$1 = fixObject<SpigotVersion$1>({
  id: fixString,
  type: fixConst('spigot'),
});

export type PapermcVersion$1 = { id: string; type: 'papermc'; build: number };
export const PapermcVersion$1 = fixObject<PapermcVersion$1>({
  id: fixString,
  type: fixConst('papermc'),
  build: fixNumber,
});

export type ForgeVersion$1 = {
  id: string;
  type: 'forge';
  forge_version: string;
  download_url: string;
};
export const ForgeVersion$1 = fixObject<ForgeVersion$1>({
  id: fixString,
  type: fixConst('forge'),
  forge_version: fixString,
  download_url: fixString,
});

export type MohistmcVersion$1 = {
  id: string;
  type: 'mohistmc';
  forge_version?: string;
  number: number;
};
export const MohistmcVersion$1 = fixObject<MohistmcVersion$1>({
  id: fixString,
  type: fixConst('mohistmc'),
  forge_version: fixString,
  number: fixNumber,
});

export type FabricVersion$1 = {
  id: string;
  type: 'fabric';
  release: boolean;
  loader: string;
  installer: string;
};
export const FabricVersion$1 = fixObject<FabricVersion$1>({
  id: fixString,
  type: fixConst('fabric'),
  release: fixBoolean,
  loader: fixString,
  installer: fixString,
});

export type Version$1 =
  | VanillaVersion$1
  | SpigotVersion$1
  | PapermcVersion$1
  | ForgeVersion$1
  | MohistmcVersion$1
  | FabricVersion$1;

export const Version$1 = fixUnion<
  [
    VanillaVersion$1,
    SpigotVersion$1,
    PapermcVersion$1,
    ForgeVersion$1,
    MohistmcVersion$1,
    FabricVersion$1
  ]
>(
  VanillaVersion$1,
  SpigotVersion$1,
  PapermcVersion$1,
  ForgeVersion$1,
  MohistmcVersion$1,
  FabricVersion$1
);
