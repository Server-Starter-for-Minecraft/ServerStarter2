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
export type SpigotVersion = { id: string; type: 'spigot' };
export type PapermcVersion = { id: string; type: 'papermc'; build: number };
export type ForgeVersion = { id: string; type: 'forge'; forge_version: string };
export type MohistmcVersion = {
  id: string;
  type: 'mohistmc';
  forge_version?: string;
  number: number;
};
export type FabricVersion = {
  id: string;
  type: 'fabric';
  release: boolean;
  loader: string;
  installer: string;
};

export type Version =
  | VanillaVersion
  | SpigotVersion
  | PapermcVersion
  | ForgeVersion
  | MohistmcVersion
  | FabricVersion;
