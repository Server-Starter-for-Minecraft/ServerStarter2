import { VersionId } from 'app/src-electron/schema/version';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { BytesData } from '../../util/binary/bytesData';
import { Failable } from '../../util/error/failable';
import { versionManifestPath } from '../const';
import { versionConfig } from '../stores/config';

export type ManifestRecord = {
  id: VersionId;
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

  // 失敗した場合ローカルから取得
  if (isError(response)) return getLocalVersionMainfest();

  // 成功した場合ローカルに保存
  versionConfig.set('version_manifest_v2_sha1', await response.hash('sha1'));
  const failableWrite = versionManifestPath.write(response);
  if (isError(failableWrite)) return getLocalVersionMainfest();

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
