import { Failable } from '../schema/error';
import { OsPlatform } from '../schema/os';
import { errorMessage } from '../util/error/construct';
import { isError } from '../util/error/error';
import { listReleases, ReleaseAsset } from '../util/github/schema/release';

/** githubからリリース番号を取得 */
export async function getLatestRelease(
  osPLatform: OsPlatform,
  pat: string | undefined
): Promise<Failable<GithubRelease>> {
  const json = await listReleases(
    'Server-Starter-for-Minecraft',
    'ServerStarter2',
    pat
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

function parseAssets(assets: ReleaseAsset[], osPLatform: OsPlatform) {
  const suffix = {
    redhat: '.rpm',
    debian: '.deb',
    'mac-os': '.pkg',
    'mac-os-arm64': '.pkg',
    'windows-x64': '.msi',
  }[osPLatform];

  return assets.find(({ browser_download_url: url }) => url.endsWith(suffix))
    ?.url;
}

export type GithubRelease = {
  platform: OsPlatform;
  /** 接頭辞vのついたSemVar e.g. "v1.2.3" */
  version: string;
  url: string;
};
