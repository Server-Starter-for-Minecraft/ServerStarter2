export const versionTypes = [
  'vanilla',
  'spigot',
  'papermc',
  'forge',
  'mohistmc',
  'fabric',
] as const;

export type VersionType = (typeof versionTypes)[number];

export type VanillaVersion = { id: string; type: 'vanilla'; release: boolean };
export type AllVanillaVersion = { id: string; release: boolean }[];

export type SpigotVersion = { id: string; type: 'spigot' };
export type AllSpigotVersion = { id: string }[];

export type PapermcVersion = { id: string; type: 'papermc'; build: number };
export type AllPapermcVersion = { id: string; builds: number[] }[];

export type ForgeVersion = { id: string; type: 'forge'; forge_version: string };
export type AllForgeVersion = {
  id: string;
  forge_versions: string[];
  recommended?: string;
}[];

export type MohistmcVersion = {
  id: string;
  type: 'mohistmc';
  forge_version?: string;
  number: number;
};
export type AllMohistmcVersion = {
  id: string;
  builds: { number: number; forge_version?: string }[];
}[];

export type FabricVersion = {
  id: string;
  type: 'fabric';
  release: boolean;
  loader: string;
  installer: string;
};
export type AllFabricVersion = {
  games: { id: string; release: boolean }[];
  loaders: string[];
  installers: string[];
};

export type Version =
  | VanillaVersion
  | SpigotVersion
  | PapermcVersion
  | ForgeVersion
  | MohistmcVersion
  | FabricVersion;

export type AllVersion<T extends VersionType> = T extends 'vanilla'
  ? AllVanillaVersion
  : T extends 'spigot'
  ? AllSpigotVersion
  : T extends 'papermc'
  ? AllPapermcVersion
  : T extends 'forge'
  ? AllForgeVersion
  : T extends 'mohistmc'
  ? AllMohistmcVersion
  : T extends 'fabric'
  ? AllFabricVersion
  : never;
