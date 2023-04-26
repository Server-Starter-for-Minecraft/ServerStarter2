import { Failable, isFailure } from 'src-electron/api/failable';
import {
  BytesData,
  Hash,
} from 'src-electron/core/utils/bytesData/bytesData';
import { BlobRes, CommitRes, TreeRes } from './githubApiTypes';

async function get<T>(url: string, pat: string): Promise<Failable<T>> {
  // PATの認証情報をヘッダーに付与してfetch
  const requestHeader = {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
  };
  const responce = await BytesData.fromURL(url, undefined, requestHeader);
  if (isFailure(responce)) return responce;

  // jsonを取得
  const json = await responce.json<T>();
  return json;
}

export async function fetchGithubFile(
  owner: string,
  repo: string,
  branch: string,
  path: string[],
  pat: string
) {
  const commitURL = `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`;
  const commitRes = await get<CommitRes>(commitURL, pat);
  if (isFailure(commitRes)) return commitRes;
  let tree = commitRes.commit.commit.tree;

  for (let elem of path) {
    const treeRes = await get<TreeRes>(tree.url, pat);
    if (isFailure(treeRes)) return treeRes;

    if (treeRes.tree === undefined)
      return new Error(
        `github.com/${owner}/${repo}/${branch}/${path.join('/')} is not exists.`
      );

    for (const entry of treeRes.tree) {
      if (elem === entry.path) {
        tree = entry;
        break;
      }
    }
  }

  const blobRes = await get<BlobRes>(tree.url, pat);
  if (isFailure(blobRes)) return blobRes;
  if (blobRes.content === undefined)
    return new Error(
      `github.com/${owner}/${repo}/${branch}/${path.join(
        '/'
      )} is not file but directory.`
    );

  switch (blobRes.encoding) {
    case 'utf-8':
      return BytesData.fromText(blobRes.content);
    case 'base64':
      return BytesData.fromBase64(blobRes.content);
    default:
      throw new Error(`unknown github api blob encoding: ${blobRes.encoding}`);
  }
}