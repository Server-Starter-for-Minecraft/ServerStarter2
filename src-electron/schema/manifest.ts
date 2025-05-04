import { z } from 'zod';

export const ManifestDirectory = z.object({
  type: z.literal('directory'),
});
export type ManifestDirectory = z.infer<typeof ManifestDirectory>;

export const ManifestLink = z.object({
  type: z.literal('link'),
  target: z.string(),
});
export type ManifestLink = z.infer<typeof ManifestLink>;

export const ManifestFile = z.object({
  type: z.literal('file'),
  executable: z.boolean(),
  downloads: z.object({
    raw: z.object({
      sha1: z.string(),
      size: z.number(),
      url: z.string(),
    }),
  }),
});
export type ManifestFile = z.infer<typeof ManifestFile>;

export const ManifestContent = z.object({
  files: z.record(
    z.string(),
    z.discriminatedUnion('type', [
      ManifestDirectory,
      ManifestLink,
      ManifestFile,
    ])
  ),
});
export type ManifestContent = z.infer<typeof ManifestContent>;
