import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { AllPapermcVersion, VersionId } from '../../../schema/version';
import { VersionListLoader } from './base';

// Paperのバージョン一覧を返すURLとその解析パーサー
const paperAllVersionsURL = 'https://api.papermc.io/v2/projects/paper';
const paperAllVersionsZod = z.object({
  project_id: z.enum(['paper']),
  project_name: z.enum(['Paper']),
  version_groups: z.string().array(),
  versions: z.string().array(),
});
// 各バージョンのビルド情報一覧を返すURLとその解析パーサー
const paperEachVersionURL = (versionName: string) =>
  `https://api.papermc.io/v2/projects/paper/versions/${versionName}`;
const paperEachVersionZod = z.object({
  project_id: z.enum(['paper']),
  project_name: z.enum(['Paper']),
  version: z.string().transform((val) => val as VersionId),
  builds: z.number().array(),
});

/**
 * Paper版のVersionLoaderを作成
 */
export class PaperVersionLoader extends VersionListLoader<AllPapermcVersion> {
  constructor(cachePath: Path) {
    super(cachePath, 'papermc', AllPapermcVersion);
  }

  async getFromURL() {
    // 全バージョンのメタ情報を読み込み
    const allVerMeta = await loadAllVersion();
    if (isError(allVerMeta)) return allVerMeta;

    // メタ情報を各バージョンオブジェクトに変換
    const results = await Promise.all(
      allVerMeta.versions.reverse().map(loadEachVersion)
    );
    return results.filter(isValid);
  }
}

/**
 * 全てのバージョンのメタ情報を収集
 */
async function loadAllVersion() {
  const jsonBytes = await BytesData.fromURL(paperAllVersionsURL);
  if (isError(jsonBytes)) return jsonBytes;
  return jsonBytes.json(paperAllVersionsZod);
}

/**
 * メタ情報から当該バージョンのオブジェクトを生成
 */
async function loadEachVersion(
  versionName: string
): Promise<Failable<AllPapermcVersion[number]>> {
  const jsonBytes = await BytesData.fromURL(paperEachVersionURL(versionName));
  if (isError(jsonBytes)) return jsonBytes;
  const parsedEachVerJson = await jsonBytes.json(paperEachVersionZod);
  if (isError(parsedEachVerJson)) return parsedEachVerJson;

  return {
    id: parsedEachVerJson.version,
    builds: parsedEachVerJson.builds,
  };
}
