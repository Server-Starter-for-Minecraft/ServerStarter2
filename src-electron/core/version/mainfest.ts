import { versionConfig } from '../stores/config';
import { BytesData } from '../../util/bytesData';
import { Failable } from '../../util/error/failable';
import { versionManifestPath } from '../const';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';

export type ManifestRecord = {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  time: string;
  releaseTime: string;
  sha1: string;
  complianceLevel: number;
};

export type ManifestJson = {
  latest: { release: string; snapshot: string };
  versions: ManifestRecord[];
};

const MANIFEST_URL =
  'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';

/** version_manifest_v2.jsonを取得して内容を返す */
export async function getVersionMainfest(): Promise<Failable<ManifestJson>> {
  // URLからデータを取得 (内容が変わっている可能性があるのでsha1チェックは行わない)
  const response = await BytesData.fromURL(MANIFEST_URL);

  if (isValid(response)) {
    // 成功した場合ローカルに保存
    versionConfig.set('version_manifest_v2_sha1', await response.hash('sha1'));
    versionManifestPath.write(response);
  } else {
    // 失敗した場合ローカルから取得
    return getLocalVersionMainfest();
  }

  const manifest = await response.json<ManifestJson>();
  return manifest;
}

/** ローカルから取得 */
async function getLocalVersionMainfest(): Promise<Failable<ManifestJson>> {
  if (!versionManifestPath.exists())
    return errorMessage.data.path.notFound({
      type: 'file',
      path: versionManifestPath.path,
    });

  const manifestData = await versionManifestPath.read();

  if (isError(manifestData)) return manifestData;

  const manifestSha1 = versionConfig.get('version_manifest_v2_sha1');
  if ((await manifestData.hash('sha1')) !== manifestSha1)
    return errorMessage.data.hashNotMatch({
      hashtype: 'sha1',
      type: 'file',
      path: versionManifestPath.path,
    });

  return manifestData.json();
}
