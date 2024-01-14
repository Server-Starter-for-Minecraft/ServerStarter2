import { Failable } from '../schema/error';
import { errorMessage } from '../util/error/construct';
import { isError } from '../util/error/error';
import { ReleaseAsset, listReleases } from '../util/github/schema/release';
import { OsPlatform } from '../util/os';

/** githubからリリース番号を取得 */
export async function getLatestRelease(
  osPLatform: OsPlatform
): Promise<Failable<GithubRelease>> {
  // 環境変数SERVERSTARTER_MODEが"debug"だった場合は環境変数SERVERSTARTER_TOKENからgitのPATを取得
  const PAT =
    process.env.SERVERSTARTER_MODE === 'debug'
      ? process.env.SERVERSTARTER_TOKEN
      : undefined;

  const json = await listReleases(
    'Server-Starter-for-Minecraft',
    'ServerStarter2',
    PAT
  );

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
  assets: ReleaseAsset[],
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
