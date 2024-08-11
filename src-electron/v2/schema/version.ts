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
  jar: z.object({
    url: z.string(),
    md5: z.string(),
  }),
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

export const AllVanillaVersion = z
  .object({
    id: VersionId,
    release: z.boolean(),
  })
  .array();
export type AllVanillaVersion = z.infer<typeof AllVanillaVersion>;

export const AllSpigotVersion = z
  .object({
    id: VersionId,
  })
  .array();
export type AllSpigotVersion = z.infer<typeof AllSpigotVersion>;

export const AllPapermcVersion = z
  .object({
    id: VersionId,
    builds: z.number().array(),
  })
  .array();
export type AllPapermcVersion = z.infer<typeof AllPapermcVersion>;

export const AllForgeVersion = z
  .object({
    id: VersionId,
    forge_versions: z
      .object({
        version: z.string(),
        url: z.string(),
      })
      .array(),
    recommended: z
      .object({
        version: z.string(),
        url: z.string(),
      })
      .optional(),
  })
  .array();
export type AllForgeVersion = z.infer<typeof AllForgeVersion>;

export const AllMohistmcVersion = z
  .object({
    id: VersionId,
    builds: z
      .object({
        number: z.number(),
        forge_version: z.string().optional(),
        jar: z.object({
          url: z.string(),
          md5: z.string(),
        }),
      })
      .array(),
  })
  .array();
export type AllMohistmcVersion = z.infer<typeof AllMohistmcVersion>;

export const AllFabricVersion = z.object({
  games: z
    .object({
      id: VersionId,
      release: z.boolean(),
    })
    .array(),
  loaders: z
    .object({
      version: z.string(),
      stable: z.boolean(),
    })
    .array(),
  installers: z
    .object({
      version: z.string(),
      stable: z.boolean(),
    })
    .array(),
});
export type AllFabricVersion = z.infer<typeof AllFabricVersion>;

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
