import { BytesData } from 'src-electron/util/binary/bytesData';
import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { WorldSettings } from '../../../source/world/files/json';
import { BlobRes, CommitRes, TreeRes } from './githubApiTypes';

/** リポジトリのブランチ一覧を取得 */
export async function getGithubBranches(
  owner: string,
  repo: string,
  pat: string
) {
  const commitURL = `https://api.github.com/repos/${owner}/${repo}/branches`;
  const commitRes = await get(
    z.object({ name: z.string() }).array(),
    commitURL,
    pat
  );
  if (isError(commitRes)) return commitRes;
  return commitRes.map((x) => x.name);
}

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
    const commitRes = await get(CommitRes, commitURL, pat);
    if (isError(commitRes)) return commitRes;
    return new GithubTree(commitRes.commit.commit.tree.url, pat);
  }

  async files() {
    const treeRes = await get(TreeRes, this.url, this.pat);
    if (isError(treeRes)) return treeRes;
    if (treeRes.tree === undefined)
      return errorMessage.data.githubAPI.fetchFailed({ url: this.url });

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
    const blobRes = await get(BlobRes, this.url, this.pat);
    if (isError(blobRes)) return blobRes;

    switch (blobRes.encoding) {
      case 'utf-8':
        return await BytesData.fromText(blobRes.content);
      case 'base64':
        return await BytesData.fromBase64(blobRes.content);
      default:
        return errorMessage.data.githubAPI.unknownBlobEncoding({
          url: this.url,
          encoding: blobRes.encoding,
        });
    }
  }

  async loadText() {
    const blobRes = await get(BlobRes, this.url, this.pat);
    if (isError(blobRes)) return blobRes;

    switch (blobRes.encoding) {
      case 'utf-8':
        return blobRes.content;
      case 'base64':
        const b64data = await BytesData.fromBase64(blobRes.content);
        if (isError(b64data)) return b64data;
        return await b64data.text();
      default:
        return errorMessage.data.githubAPI.unknownBlobEncoding({
          url: this.url,
          encoding: blobRes.encoding,
        });
    }
  }

  async loadJson(): Promise<Failable<WorldSettings>> {
    const blobRes = await get(BlobRes, this.url, this.pat);
    if (isError(blobRes)) return blobRes;

    let data: Failable<WorldSettings>;
    switch (blobRes.encoding) {
      case 'utf-8':
        data = JSON.parse(blobRes.content);
        break;
      case 'base64':
        const b64data = await BytesData.fromBase64(blobRes.content);
        if (isError(b64data)) return b64data;
        data = await b64data.json(WorldSettings);
        break;
      default:
        return errorMessage.data.githubAPI.unknownBlobEncoding({
          url: this.url,
          encoding: blobRes.encoding,
        });
    }
    if (isError(data)) return data;

    const fixed = WorldSettings.safeParse(data);
    if (!fixed.success) {
      return errorMessage.data.failJsonFix();
    }
    return fixed.data;
  }
}

async function get<T>(
  validator: z.ZodSchema<T, z.ZodTypeDef, any>,
  url: string,
  pat: string
): Promise<Failable<T>> {
  // PATの認証情報をヘッダーに付与してfetch
  const requestHeader = {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
  };
  const responce = await BytesData.fromURL(url, undefined, requestHeader);
  if (isError(responce)) return responce;

  // jsonを取得
  const json = await responce.json(validator);
  return json;
}
