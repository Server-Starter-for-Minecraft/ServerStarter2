import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { fromEntries } from 'app/src-electron/util/obj/obj';
import { AllMohistmcVersion, VersionId } from '../../../schema/version';
import { VersionListLoader } from './base';

// Mohistのバージョン一覧を返すURLとその解析パーサー
const mohistAllVersionsURL = 'https://mohistmc.com/api/v2/projects';
const mohistAllVersionsZod = z.array(
  z.object({
    project: z.string(),
    versions: z.string().array(),
  })
);

// 各バージョンのビルド情報一覧を返すURLとその解析パーサー
const mohistEachVersionURL = (versionName: string) =>
  `https://mohistmc.com/api/v2/projects/mohist/${versionName}/builds`;
const mohistEachVersionZod = z.object({
  projectName: z.string(),
  projectVersion: VersionId,
  builds: z
    .object({
      id: z.string().optional(),
      number: z.number().optional(),
      gitSha: z.string(),
      forgeVersion: z.string().optional(),
      neoForgeVersion: z.string().optional(),
      fileMd5: z.string(),
      originUrl: z.string(),
      url: z.string(),
      createdAt: z.number(),
    })
    .array()
    .min(1),
});

/**
 * Mohist版のVersionLoaderを作成
 */
export class MohistMCVersionLoader extends VersionListLoader<'mohistmc'> {
  constructor(cachePath: Path) {
    super(cachePath, 'mohistmc', AllMohistmcVersion);
  }

  async getFromURL() {
    // 全バージョンのメタ情報を読み込み
    const allVerMeta = await loadAllVersion();
    if (isError(allVerMeta)) return allVerMeta;

    // メタ情報を各バージョンオブジェクトに変換
    const results = await Promise.all(
      allVerMeta.reverse().map(loadEachVersion)
    );
    return results.filter(isValid);
  }
}

/**
 * 全てのバージョンのメタ情報を収集
 */
async function loadAllVersion(): Promise<Failable<string[]>> {
  const jsonBytes = await BytesData.fromURL(mohistAllVersionsURL);
  if (isError(jsonBytes)) return jsonBytes;
  const parsedJson: Failable<Record<string, string[]>> = await jsonBytes.json(
    mohistAllVersionsZod.transform((objs) =>
      fromEntries(objs.map((obj) => [obj.project, obj.versions]))
    )
  );
  if (isError(parsedJson)) return parsedJson;

  return parsedJson['mohist'];
}

/**
 * メタ情報から当該バージョンのオブジェクトを生成
 */
async function loadEachVersion(
  versionName: string
): Promise<Failable<AllMohistmcVersion[number]>> {
  const jsonBytes = await BytesData.fromURL(mohistEachVersionURL(versionName));
  if (isError(jsonBytes)) return jsonBytes;
  const parsedEachVerJson = await jsonBytes.json(mohistEachVersionZod);
  if (isError(parsedEachVerJson)) return parsedEachVerJson;

  const builds = parsedEachVerJson.builds
    .filter((b) => b.number || b.id)
    .map((b) => {
      return {
        id: (b.number?.toString() || b.id) ?? 'undefined',
        forge_version: b.forgeVersion,
        jar: {
          url: b.url,
          md5: b.fileMd5,
        },
      };
    })
    .reverse();

  return {
    id: parsedEachVerJson.projectVersion,
    builds,
  };
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('mohist api type definision', async () => {
    // https://mohistmc.com/api/v2/projects へのアクセスを想定
    const apiSample = [
      {
        project: 'mohist',
        versions: ['1.20.6', '1.21.4'],
      },
      {
        project: 'banner',
        versions: ['1.21.4', '1.21.5'],
      },
    ];

    const parsed = mohistAllVersionsZod.safeParse(apiSample);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject(apiSample);
  });
}
