import { z } from 'zod';
import { getJsonResponse } from '../rest';

export const ReleaseAsset = z.object({
  url: z.string(),
  browser_download_url: z.string(),
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  /** ラベルを設定していないアセットは空文字列またはnullになる */
  label: z.string().nullable(),
  state: z.enum(['uploaded', 'open']),
  content_type: z.string(),
  size: z.number(),
  download_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  uploader: z.any(),
});
export type ReleaseAsset = z.infer<typeof ReleaseAsset>;

/**
 * GitHubのリリース一覧APIが返すリリース
 *
 * nullを取りうる項目はGitHubのREST APIの仕様に合わせている。
 * 特にDraftのリリース（Personal Access Tokenで認証した場合のみ取得される）は，
 * 未公開のため`published_at`・`tarball_url`・`zipball_url`がnullになる
 */
export const Release = z.object({
  url: z.string(),
  html_url: z.string(),
  assets_url: z.string(),
  upload_url: z.string(),
  tarball_url: z.string().nullable(),
  zipball_url: z.string().nullable(),
  id: z.number(),
  node_id: z.string(),
  tag_name: z.string(),
  target_commitish: z.string(),
  name: z.string().nullable(),
  body: z.string().nullish(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  created_at: z.string(),
  published_at: z.string().nullable(),
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
