import { config } from '../../store';
import { BytesData } from '../../utils/bytesData/bytesData';
import { Failable, isFailure, isSuccess } from '../../utils/failable';
import { versionManifestPath } from '../const';

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

  if (isSuccess(response)) {
    // 成功した場合ローカルに保存
    config.set('version_manifest_v2_sha1', await response.sha1());
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
    return new Error('version_manifest_v2.json is missing');

  const manifestData = await versionManifestPath.read();

  if (isFailure(manifestData)) return manifestData;

  const manifestSha1 = config.get('version_manifest_v2_sha1');
  if ((await manifestData.sha1()) !== manifestSha1)
    return new Error('sha1 not match for version_manifest_v2.json');

  return manifestData.json();
}
