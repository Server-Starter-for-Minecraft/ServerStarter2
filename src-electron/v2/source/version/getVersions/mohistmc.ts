import { z } from 'zod';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { AllMohistmcVersion, VersionId } from '../../../schema/version';
import {
  getFromCacheBase,
  getVersionCacheFilePath,
  VersionListLoader,
} from './base';

const mohistVerZod = z.object({
  id: z.string().transform((ver) => ver as VersionId),
  builds: z
    .object({
      number: z.number(),
      forge_version: z.string().optional(),
      jar: z.object({
        url: z.string(),
        md5: z.string(),
      }),
    })
    .array(),
});

/**
 * Mohistにおける`all.json`を定義
 */
const allMohistsHandler = JsonSourceHandler.fromPath<AllMohistmcVersion>(
  getVersionCacheFilePath('mohistmc'),
  mohistVerZod.array()
);

// Mohistのバージョン一覧を返すURLとその解析パーサー
const mohistAllVersionsURL = 'https://mohistmc.com/api/v2/projects';
const mohistAllVersionsZod = z
  .object({
    project: z.string(),
    versions: z.string().array(),
  })
  .array();
// 各バージョンのビルド情報一覧を返すURLとその解析パーサー
const mohistEachVersionURL = (versionName: string) =>
  `https://mohistmc.com/api/v2/projects/mohist/${versionName}/builds`;
const mohistEachVersionZod = z.object({
  projectName: z.string(),
  projectVersion: z.string().transform((v) => v as VersionId),
  builds: z
    .object({
      number: z.number(),
      gitSha: z.string(),
      forgeVersion: z.string().optional(),
      neoForgeVersion: z.string().optional(),
      fileMd5: z.string(),
      originUrl: z.string(),
      url: z.string(),
      createdAt: z.number(),
    })
    .array(),
});

/**
 * Mohist版のVersionLoaderを作成
 */
export function getMohistMCVersionLoader(): VersionListLoader<AllMohistmcVersion> {
  return {
    getFromCache: () => getFromCacheBase('mohistmc', allMohistsHandler),
    getFromURL: async () => {
      // 全バージョンのメタ情報を読み込み
      const allVerMeta = await loadAllVersion();
      if (allVerMeta.isErr) return allVerMeta;

      // メタ情報を各バージョンオブジェクトに変換
      const results = await Promise.all(
        allVerMeta.value().reverse().map(loadEachVersion)
      );
      return ok(results.filter((v) => v.isOk).map((v) => v.value()));
    },
    write4Cache: (obj) => {
      return allMohistsHandler.write(obj);
    },
  };
}

/**
 * 全てのバージョンのメタ情報を収集
 */
async function loadAllVersion(): Promise<Result<string[]>> {
  const jsonTxt = (await new Url(mohistAllVersionsURL).into(Bytes)).onOk(
    (val) => val.toStr()
  );
  if (jsonTxt.isErr) return jsonTxt;

  // json文字列をパース（エラーの可能性があるためResultでラップ）
  const parsedJson = Result.catchSync(() =>
    mohistAllVersionsZod.parse(JSON.parse(jsonTxt.value()))
  ).onOk((objs) => ok(objs.find((obj) => obj.project === 'mohist')));
  if (parsedJson.isErr) return parsedJson;

  const versions = parsedJson.value()?.versions;
  if (versions) {
    return ok(versions);
  } else {
    return err(new Error('NO_EXISTS_MOHIST_VERSIONS'));
  }
}

/**
 * メタ情報から当該バージョンのオブジェクトを生成
 */
async function loadEachVersion(
  versionName: string
): Promise<Result<AllMohistmcVersion[number]>> {
  const jsonTxt = (
    await new Url(mohistEachVersionURL(versionName)).into(Bytes)
  ).onOk((v) => v.toStr());
  if (jsonTxt.isErr) return jsonTxt;

  const parsedEachVerJson = Result.catchSync(() =>
    mohistEachVersionZod.parse(JSON.parse(jsonTxt.value()))
  );
  if (parsedEachVerJson.isErr) return parsedEachVerJson;

  const builds = parsedEachVerJson.value().builds.map((b) => {
    return {
      number: b.number,
      forge_version: b.forgeVersion,
      jar: {
        url: b.url,
        md5: b.fileMd5,
      },
    };
  });

  return ok({
    id: parsedEachVerJson.value().projectVersion,
    builds,
  });
}
