import { z } from 'zod';
import { VersionId } from 'app/src-electron/schema/version';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { BytesData } from '../../util/binary/bytesData';
import { Failable } from '../../util/error/failable';
import { versionManifestPath } from '../const';
import { versionConfig } from '../stores/config';

export const ManifestRecord = z.object({
  id: VersionId,
  type: z.enum(['release', 'snapshot', 'old_beta', 'old_alpha']),
  url: z.string(),
  time: z.string(),
  releaseTime: z.string(),
  sha1: z.string(),
  complianceLevel: z.number(),
});
export type ManifestRecord = z.infer<typeof ManifestRecord>;

export const ManifestJson = z.object({
  latest: z.object({ release: z.string(), snapshot: z.string() }),
  versions: z.array(ManifestRecord),
});
export type ManifestJson = z.infer<typeof ManifestJson>;

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

  return response.json(ManifestJson);
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

  return manifestData.json(ManifestJson);
}
