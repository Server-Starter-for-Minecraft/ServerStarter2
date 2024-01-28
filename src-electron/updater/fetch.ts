import { Failable } from '../schema/error';
import { BytesData } from '../util/bytesData';
import { errorMessage } from '../util/error/construct';
import { isError } from '../util/error/error';
import { OsPlatform } from '../util/os';

/** githubからリリース番号を取得 */
export async function getLatestRelease(
  osPLatform: OsPlatform
): Promise<Failable<GithubRelease>> {
  // 環境変数SERVERSTARTER_MODEが"debug"だった場合はリリースの取得元を変更
  const isDebug = process.env.SERVERSTARTER_MODE === 'debug';

  const SERVERSTARTER_REPOSITORY_URL = isDebug
    ? 'https://api.github.com/repos/CivilTT/ServerStarter2-ReleaseTest/releases'
    : 'https://api.github.com/repos/CivilTT/ServerStarter2/releases';

  const fetch = await BytesData.fromURL(SERVERSTARTER_REPOSITORY_URL);

  if (isError(fetch)) return fetch;
  const json = await fetch.json<GithubReleaseResponce[]>();
  if (isError(json)) return json;

  for (const i of json) {
    const url = parseAssets(i.assets, osPLatform);
    if (url)
      return {
        platform: osPLatform,
        version: i.tag_name,
        url,
      };
  }

  return errorMessage.system.assertion({ message: '' });
}

function parseAssets(
  assets: GithubReleaseAssetResponce[],
  osPLatform: OsPlatform
) {
  const suffix = {
    linux: '.AppImage',
    'mac-os': '.pkg',
    'mac-os-arm64': '.pkg',
    'windows-x64': '.msi',
  }[osPLatform];

  return assets.find(({ browser_download_url: url }) => url.endsWith(suffix))
    ?.browser_download_url;
}

export type GithubRelease = {
  platform: OsPlatform;
  version: string;
  url: string;
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
