import { Failable } from '../schema/error';
import { BytesData } from '../util/bytesData';
import { errorMessage } from '../util/error/construct';
import { isError } from '../util/error/error';
import { osPlatform } from '../util/os';

const SERVERSTARTER_REPOSITORY_URL =
  'https://api.github.com/repos/CivilTT/ServerStarter2/releases';

/** githubからリリース番号を取得 */
export async function getLatestRelease(): Promise<Failable<GithubRelease>> {
  const fetch = await BytesData.fromURL(SERVERSTARTER_REPOSITORY_URL);
  if (isError(fetch)) return fetch;
  const json = await fetch.json<GithubReleaseResponce[]>();
  if (isError(json)) return json;

  const tag_name = json[-1].tag_name;
  const match = tag_name.match(/v\.+/);
  if (match === null)
    return errorMessage.system.assertion({
      message: `invalid release tag name: ${tag_name}`,
    });

  const [windows, mac, linux] = parseAssets(json[-1].assets);
  osPlatform === 'linux';
  if (!windows || !mac || !linux)
    return errorMessage.core.update.missingAppSource();
  return {
    version: match[1],
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
    if (url.endsWith('.dmg')) {
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
