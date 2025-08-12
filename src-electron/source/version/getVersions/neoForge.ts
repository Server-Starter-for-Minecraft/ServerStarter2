import { z } from 'zod';
import { AllNeoForgeVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { toEntries } from 'app/src-electron/util/obj/obj';
import { groupBy } from 'app/src-electron/util/object/groupBy';
import { VersionListLoader } from './base';

// NeoForgeのバージョン一覧を返すURLとその解析パーサー
const neoForgeAllVersionsURL =
  'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge';
const neoForgeAllVersionsZod = z.object({
  isSnapshot: z.boolean(),
  versions: z.string().array(),
});

/**
 * neoForge版のVersionLoaderを作成
 */
export class NeoForgeVersionLoader extends VersionListLoader<'neoforge'> {
  constructor(cachePath: Path) {
    super(cachePath, 'neoforge', AllNeoForgeVersion);
  }

  async getFromURL() {
    // URLから全バージョンを取得
    const allVers = await loadAllVersion();
    if (isError(allVers)) return allVers;

    // 全バージョンをMCバージョンでグルーピング
    const ver2neoVer = groupBy(allVers.versions, getSpecificMCver);

    // 要求形式に成形
    return toEntries(ver2neoVer).map(([k, vs]) => {
      return {
        id: k,
        neoforge_versions: vs.map((v) => {
          return { version: v };
        }),
      };
    });
  }
}

/**
 * 全てのバージョンのメタ情報を収集
 */
async function loadAllVersion() {
  const jsonBytes = await BytesData.fromURL(neoForgeAllVersionsURL);
  if (isError(jsonBytes)) return jsonBytes;
  return jsonBytes.json(neoForgeAllVersionsZod);
}

/**
 * NeoForgeのバージョン表記からMCバージョンを特定
 *
 * - 20.2.8-beta -> `1.20.2`
 * - 0.25w14craftmine.4-beta -> `25w14craftmine`
 */
function getSpecificMCver(neoVer: string): VersionId {
  const [major, minor, patch] = neoVer.split('.', 3);

  let tmpVer = '';
  if (major === '0') {
    // 0.25w14craftmine.4-beta -> 25w14craftmine
    tmpVer = minor;
  } else {
    // 20.2.8-beta -> 1.20.2
    tmpVer = `1.${major}.${minor}`;
  }

  return VersionId.parse(tmpVer);
}
