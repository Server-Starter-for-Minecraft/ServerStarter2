import { Failable, isFailure } from 'src-electron/api/failable';
import { BytesData } from 'src-electron/core/utils/bytesData/bytesData';
import { BlobRes, CommitRes, TreeRes } from './githubApiTypes';
import { asyncMap } from 'app/src-electron/core/utils/objmap';

// TODO: GithubAPIのクラス化
//
// repo = new GithubTree(owner,repo,pat)
// files:{name:GithubTree|GithubBlob} = await repo.files()
// const subs = await files["child"].files()

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

async function traceTree(rootUrl: string, parts: string[], pat: string) {
  let treeUrl = rootUrl;

  for (let elem of parts) {
    const treeRes = await get<TreeRes>(treeUrl, pat);
    if (isFailure(treeRes)) return treeRes;
    if (treeRes.tree === undefined) return new Error(`${treeUrl} is not tree.`);

    for (const entry of treeRes.tree) {
      if (elem === entry.path) {
        treeUrl = entry.url;
        break;
      }
    }
  }

  const blobRes = await get<BlobRes>(treeUrl, pat);
  if (isFailure(blobRes)) return blobRes;
  if (blobRes.content === undefined) {
    return new Error(`${treeUrl} does not have content.`);
  }

  switch (blobRes.encoding) {
    case 'utf-8':
      return BytesData.fromText(blobRes.content);
    case 'base64':
      return BytesData.fromBase64(blobRes.content);
    default:
      throw new Error(
        `unknown github api blob encoding: ${blobRes.encoding}, url: ${treeUrl}`
      );
  }
}

export async function fetchGithubFiles(
  owner: string,
  repo: string,
  branch: string,
  paths: string[],
  pat: string
): Promise<Failable<BytesData>[]> {
  const commitURL = `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`;
  const commitRes = await get<CommitRes>(commitURL, pat);
  if (isFailure(commitRes)) return paths.map(() => commitRes);
  let treeUrl = commitRes.commit.commit.tree.url;

  const results = await asyncMap(paths, (path) =>
    traceTree(treeUrl, path.split('/'), pat)
  );
  return results;
}
