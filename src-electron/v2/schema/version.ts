import { z } from 'zod';

export const VersionId = z.string().brand('VanillaVersionId');
export type VersionId = z.infer<typeof VersionId>;

/** バージョン未選択や読み込み失敗時を表すバージョン */
export const UnknownVersion = z.object({
  type: z.literal('unknown'),
});
export type UnknownVersion = z.infer<typeof UnknownVersion>;

export const VanillaVersion = z.object({
  type: z.literal('vanilla'),
  id: VersionId,
  release: z.boolean(),
});
export type VanillaVersion = z.infer<typeof VanillaVersion>;

export const SpigotVersion = z.object({
  type: z.literal('spigot'),
  id: VersionId,
});
export type SpigotVersion = z.infer<typeof SpigotVersion>;

export const PapermcVersion = z.object({
  type: z.literal('papermc'),
  id: VersionId,
  build: z.number(),
});
export type PapermcVersion = z.infer<typeof PapermcVersion>;

export const ForgeVersion = z.object({
  type: z.literal('forge'),
  id: VersionId,
  forge_version: z.string(),
  download_url: z.string(),
});
export type ForgeVersion = z.infer<typeof ForgeVersion>;

export const MohistmcVersion = z.object({
  type: z.literal('mohistmc'),
  id: VersionId,
  forge_version: z.string().optional(),
  number: z.number(),
});
export type MohistmcVersion = z.infer<typeof MohistmcVersion>;

export const FabricVersion = z.object({
  type: z.literal('fabric'),
  id: VersionId,
  release: z.boolean(),
  loader: z.string(),
  installer: z.string(),
});
export type FabricVersion = z.infer<typeof FabricVersion>;

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

export const Version = z.discriminatedUnion('type', [
  UnknownVersion,
  VanillaVersion,
  SpigotVersion,
  PapermcVersion,
  ForgeVersion,
  MohistmcVersion,
  FabricVersion,
]);
export type Version = z.infer<typeof Version>;
