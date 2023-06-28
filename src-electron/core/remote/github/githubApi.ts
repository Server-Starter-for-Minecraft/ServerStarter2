import { Failable } from 'app/src-electron/util/error/failable';
import { isError } from 'app/src-electron/util/error/error';
import { BytesData } from 'src-electron/util/bytesData';
import { BlobRes, CommitRes, TreeRes } from './githubApiTypes';

export class GithubTree {
  url: string;
  pat: string;

  constructor(url: string, pat: string) {
    this.url = url;
    this.pat = pat;
  }

  static async fromRepository(
    owner: string,
    repo: string,
    branch: string,
    pat: string
  ) {
    const commitURL = `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`;
    const commitRes = await get<CommitRes>(commitURL, pat);
    if (isError(commitRes)) return commitRes;
    return new GithubTree(commitRes.commit.commit.tree.url, pat);
  }

  async files() {
    const treeRes = await get<TreeRes>(this.url, this.pat);
    if (isError(treeRes)) return treeRes;
    if (treeRes.tree === undefined)
      return new Error(`${this.url} is not tree.`);

    const entries: [string, GithubTree | GithubBlob][] = treeRes.tree.map(
      (sub) => [
        sub.path,
        sub.type === 'tree'
          ? new GithubTree(sub.url, this.pat)
          : new GithubBlob(sub.url, this.pat),
      ]
    );

    return Object.fromEntries(entries);
  }
}

export class GithubBlob {
  url: string;
  pat: string;

  constructor(url: string, pat: string) {
    this.url = url;
    this.pat = pat;
  }

  async loadBytes() {
    const blobRes = await get<BlobRes>(this.url, this.pat);
    if (isError(blobRes)) return blobRes;

    switch (blobRes.encoding) {
      case 'utf-8':
        return await BytesData.fromText(blobRes.content);
      case 'base64':
        return await BytesData.fromBase64(blobRes.content);
      default:
        throw new Error(
          `unknown github api blob encoding: ${blobRes.encoding}, url: ${this.url}`
        );
    }
  }

  async loadText() {
    const blobRes = await get<BlobRes>(this.url, this.pat);
    if (isError(blobRes)) return blobRes;

    switch (blobRes.encoding) {
      case 'utf-8':
        return blobRes.content;
      case 'base64':
        const b64data = await BytesData.fromBase64(blobRes.content);
        if (isError(b64data)) return b64data;
        return await b64data.text();
      default:
        throw new Error(
          `unknown github api blob encoding: ${blobRes.encoding}, url: ${this.url}`
        );
    }
  }

  async loadJson<T>(): Promise<Failable<T>> {
    const blobRes = await get<BlobRes>(this.url, this.pat);
    if (isError(blobRes)) return blobRes;

    switch (blobRes.encoding) {
      case 'utf-8':
        return JSON.parse(blobRes.content);
      case 'base64':
        const b64data = await BytesData.fromBase64(blobRes.content);
        if (isError(b64data)) return b64data;
        return await b64data.json<T>();
      default:
        throw new Error(
          `unknown github api blob encoding: ${blobRes.encoding}, url: ${this.url}`
        );
    }
  }
}

async function get<T>(url: string, pat: string): Promise<Failable<T>> {
  // PATの認証情報をヘッダーに付与してfetch
  const requestHeader = {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
  };
  const responce = await BytesData.fromURL(url, undefined, requestHeader);
  if (isError(responce)) return responce;

  // jsonを取得
  const json = await responce.json<T>();
  return json;
}
