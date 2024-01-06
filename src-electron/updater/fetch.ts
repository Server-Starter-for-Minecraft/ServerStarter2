import { Failable } from '../schema/error';
import { BytesData } from '../util/bytesData';
import { errorMessage } from '../util/error/construct';
import { isError } from '../util/error/error';

/** githubからリリース番号を取得 */
export async function getLatestRelease(): Promise<Failable<GithubRelease>> {

  // 環境変数SERVERSTARTER_MODEが"debug"だった場合はリリースの取得元を変更
  const isDebug = process.env.SERVERSTARTER_MODE === "debug"

  const SERVERSTARTER_REPOSITORY_URL = isDebug ?
    'https://api.github.com/repos/CivilTT/ServerStarter2-ReleaseTest/releases' :
    'https://api.github.com/repos/CivilTT/ServerStarter2/releases';

  const fetch = await BytesData.fromURL(SERVERSTARTER_REPOSITORY_URL);
  if (isError(fetch)) return fetch;
  const json = await fetch.json<GithubReleaseResponce[]>();
  if (isError(json)) return json;
  const last = json[0];
  if (last === undefined) return errorMessage.system.assertion({ message: '' });

  const tag_name = last.tag_name;

  const [windows, mac, linux] = parseAssets(last.assets);

  // if (!windows || !mac || !linux)
  if (!windows || !mac) return errorMessage.core.update.missingAppSource();
  return {
    version: tag_name,
    windows,
    mac,
    linux,
  };
}

function parseAssets(assets: GithubReleaseAssetResponce[]) {
  let windows: string | undefined = undefined;
  let mac: string | undefined = undefined;
  let linux: string | undefined = undefined;
  assets.forEach(({ browser_download_url: url }) => {
    if (url.endsWith('.msi')) {
      windows = url;
      return;
    }
    if (url.endsWith('.pkg')) {
      mac = url;
      return;
    }
    if (url.endsWith('.AppImage')) {
      linux = url;
      return;
    }
  });
  return [windows, mac, linux];
}

export type GithubRelease = {
  version: string;
  windows: string;
  mac: string;
  linux: string;
};

type GithubReleaseResponce = {
  tag_name: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  assets: GithubReleaseAssetResponce[];
};

type GithubReleaseAssetResponce = {
  browser_download_url: string;
};
