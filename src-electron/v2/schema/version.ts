import { NewType } from '../util/type/newtype';

export type VersionId = NewType<string, 'VanillaVersionId'>;

/** バージョン未選択や読み込み失敗時を表すバージョン */
export type UnknownVersion = {
  type: 'unknown';
};

export type VanillaVersion = {
  type: 'vanilla';
  id: VersionId;
  release: boolean;
};

export type SpigotVersion = {
  type: 'spigot';
  id: VersionId;
};

export type PapermcVersion = {
  type: 'papermc';
  id: VersionId;
  build: number;
};

export type ForgeVersion = {
  type: 'forge';
  id: VersionId;
  forge_version: string;
  download_url: string;
};

export type MohistmcVersion = {
  id: VersionId;
  type: 'mohistmc';
  forge_version?: string;
  number: number;
};

export type FabricVersion = {
  id: VersionId;
  type: 'fabric';
  release: boolean;
  loader: string;
  installer: string;
};

export type AllVanillaVersion = {
  id: VersionId;
  release: boolean;
}[];

export type AllSpigotVersion = {
  id: VersionId;
}[];

export type AllPapermcVersion = {
  id: VersionId;
  builds: number[];
}[];

export type AllForgeVersion = {
  id: VersionId;
  forge_versions: { version: string; url: string }[];
  recommended?: { version: string; url: string };
}[];

export type AllMohistmcVersion = {
  id: VersionId;
  builds: { number: number; forge_version?: string }[];
}[];

export type AllFabricVersion = {
  games: { id: VersionId; release: boolean }[];
  loaders: string[];
  installers: string[];
};

export type Version =
  | UnknownVersion
  | VanillaVersion
  | SpigotVersion
  | PapermcVersion
  | ForgeVersion
  | MohistmcVersion
  | FabricVersion;