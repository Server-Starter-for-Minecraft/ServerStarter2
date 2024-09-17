import { z } from 'zod';
import { VersionId } from 'app/src-electron/v2/schema/version';
import { Result } from 'app/src-electron/v2/util/base';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { Bytes } from '../../../util/binary/bytes';

const MANIFEST_URL =
  'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';
const MANIFEST_PATH = (cachePath: Path) =>
  cachePath.child('version_manifest_v2.json');

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

let manifestHandler: JsonSourceHandler<ManifestJson> | undefined = undefined;

/** version_manifest_v2.jsonを取得して内容を返す */
export async function getVersionMainfest(
  cachePath: Path,
  useCache: boolean
): Promise<Result<ManifestJson>> {
  if (!manifestHandler) {
    manifestHandler = JsonSourceHandler.fromPath(
      MANIFEST_PATH(cachePath),
      ManifestJsonZod
    );
  }

  if (useCache) {
    const cachedManifest = await manifestHandler.read();
    if (cachedManifest.isOk) return cachedManifest;
  }

  // URLからデータを取得
  const response = await new Url(MANIFEST_URL).into(Bytes);

  if (response.isOk) {
    const strRes = response.value().toStr();
    if (strRes.isErr) {
      return strRes;
    } else {
      // 取得したJsonを`version_manifest_v2.json`に保存する
      await manifestHandler.write(JSON.parse(strRes.value()));
    }
  }

  return manifestHandler.read();
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('', async () => {
    const { Path } = await import('src-electron/v2/util/binary/path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child('work');
    workPath.mkdir();

    test('manifest-handler-check', async () => {
      const res = await getVersionMainfest(workPath, false);
      expect(res.isOk).toBe(true);
    });
  });
}
