import { z } from 'zod';
import { versionManifestPath } from 'app/src-electron/v2/core/const';
import { VersionId } from 'app/src-electron/v2/schema/version';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { SHA1 } from 'app/src-electron/v2/util/binary/hash';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { Bytes } from '../../../util/binary/bytes';
import { getFromGeneralVerConfig, writeVersManifestHash } from './config';

const MANIFEST_URL =
  'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';

const ManifestRecordZod = z.object({
  id: z.string().transform((val) => val as VersionId),
  type: z.enum(['release', 'snapshot', 'old_beta', 'old_alpha']),
  url: z.string(),
  time: z.string(),
  releaseTime: z.string(),
  sha1: z.string(),
  complianceLevel: z.number(),
});
export type ManifestRecord = z.infer<typeof ManifestRecordZod>;

const ManifestJsonZod = z.object({
  latest: z.object({
    release: z.string(),
    snapshot: z.string(),
  }),
  versions: ManifestRecordZod.array(),
});
export type ManifestJson = z.infer<typeof ManifestJsonZod>;

const manifestHandler = JsonSourceHandler.fromPath(
  versionManifestPath,
  ManifestJsonZod
);

/** version_manifest_v2.jsonを取得して内容を返す */
export async function getVersionMainfest(): Promise<Result<ManifestJson>> {
  // URLからデータを取得 (内容が変わっている可能性があるのでsha1チェックは行わない)
  const response = await new Url(MANIFEST_URL).into(Bytes);

  if (response.isOk) {
    const strRes = response.value().toStr();
    if (strRes.isErr) {
      return strRes;
    } else {
      // 取得したJsonのHashデータを保存する
      writeVersManifestHash(response.value());
      // 取得したJsonを`version_manifest_v2.json`に保存する
      manifestHandler.write(JSON.parse(strRes.value()));
    }
  } else {
    // 失敗した場合ローカルから取得
    return getLocalVersionMainfest();
  }

  return manifestHandler.read();
}

/** ローカルから取得 */
async function getLocalVersionMainfest(): Promise<Result<ManifestJson>> {
  const manifestData = await manifestHandler.read();
  if (manifestData.isErr) return manifestData;

  const versConfig = await getFromGeneralVerConfig();
  if (versConfig.isErr) return versConfig;

  const manifestSha1 = versConfig.value().version_manifest_v2_sha1;
  const manifestJsonHash = await Bytes.fromString(
    JSON.stringify(manifestData.value())
  ).into(SHA1);

  if (manifestJsonHash.isErr) {
    return manifestJsonHash;
  } else if (manifestJsonHash.value() !== manifestSha1)
    // 旧実装
    // return errorMessage.data.hashNotMatch({
    //   hashtype: 'sha1',
    //   type: 'file',
    //   path: versionManifestPath.path,
    // });
    return err(new Error('NOT_MATCHED_MANIFEST_HASH'));

  return ok(manifestData.value());
}
