import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { VersionId } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isValid } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';

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
): Promise<Failable<ManifestJson>> {
  if (!manifestHandler) {
    manifestHandler = JsonSourceHandler.fromPath(
      MANIFEST_PATH(cachePath),
      ManifestJsonZod
    );
  }

  if (useCache) {
    const cachedManifest = await manifestHandler.read();
    if (isValid(cachedManifest)) return cachedManifest;
  }

  // URLからデータを取得
  const response = await BytesData.fromURL(MANIFEST_URL);

  if (isValid(response)) {
    const resJson = await response.json(ManifestJsonZod);
    if (isValid(resJson)) {
      // 取得したJsonを`version_manifest_v2.json`に保存する
      await manifestHandler.write(resJson);
    } else {
      return resJson;
    }
  }

  return manifestHandler.read();
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const path = await import('path');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child(
    'work',
    path.basename(__filename, '.ts')
  );
  await workPath.emptyDir();

  test('manifest-handler-check', async () => {
    const res = await getVersionMainfest(workPath, false);
    expect(isValid(res)).toBe(true);
  });
}
