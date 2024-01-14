import { getJsonResponse } from '../rest';

export type ReleaseAsset = {
  url: string;
  browser_download_url: string;
  id: 1;
  node_id: string;
  name: string;
  label: string;
  state: 'uploaded' | 'open';
  content_type: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  uploader: {};
};

export type Release = {
  url: string;
  html_url: string;
  assets_url: string;
  upload_url: string;
  tarball_url: string;
  zipball_url: string;
  id: 1;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  author: {};
  assets: ReleaseAsset[];
};

export async function listReleases(
  owner: string,
  repo: string,
  pat?: string,
  accept = 'application/vnd.github+json'
) {
  return getJsonResponse<Release[]>(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    pat,
    accept
  );
}
