import { z } from 'zod';
import { getJsonResponse } from '../rest';

export const ReleaseAsset = z.object({
  url: z.string(),
  browser_download_url: z.string(),
  id: z.literal(1),
  node_id: z.string(),
  name: z.string(),
  label: z.string(),
  state: z.enum(['uploaded', 'open']),
  content_type: z.string(),
  size: z.number(),
  download_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  uploader: z.any(),
});
export type ReleaseAsset = z.infer<typeof ReleaseAsset>;

export const Release = z.object({
  url: z.string(),
  html_url: z.string(),
  assets_url: z.string(),
  upload_url: z.string(),
  tarball_url: z.string(),
  zipball_url: z.string(),
  id: z.literal(1),
  node_id: z.string(),
  tag_name: z.string(),
  target_commitish: z.string(),
  name: z.string(),
  body: z.string(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  created_at: z.string(),
  published_at: z.string(),
  author: z.any(),
  assets: z.array(ReleaseAsset),
});
export type Release = z.infer<typeof Release>;

export async function listReleases(
  owner: string,
  repo: string,
  pat?: string,
  accept = 'application/vnd.github+json'
) {
  return getJsonResponse(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    Release.array(),
    pat,
    accept
  );
}
