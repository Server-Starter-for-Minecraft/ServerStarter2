import { z } from 'zod';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { AllPapermcVersion, VersionId } from '../../../schema/version';
import {
  getFromCacheBase,
  getVersionCacheFilePath,
  VersionListLoader,
} from './base';

const paperVerZod = z.object({
  id: z.string().transform((ver) => ver as VersionId),
  builds: z.number().array(),
});

/**
 * Paperにおける`all.json`を定義
 */
const allPapersHandler = JsonSourceHandler.fromPath<AllPapermcVersion>(
  getVersionCacheFilePath('papermc'),
  paperVerZod.array()
);

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
export function getPaperVersionLoader(): VersionListLoader<AllPapermcVersion> {
  return {
    getFromCache: () => getFromCacheBase('papermc', allPapersHandler),
    getFromURL: async (): Promise<Result<AllPapermcVersion>> => {
      // 全バージョンのメタ情報を読み込み
      const allVerMeta = await loadAllVersion();
      if (allVerMeta.isErr) return allVerMeta;

      // メタ情報を各バージョンオブジェクトに変換
      const results = await Promise.all(
        allVerMeta.value().versions.reverse().map(loadEachVersion)
      );
      return ok(results.filter((v) => v.isOk).map((v) => v.value()));
    },
    write4Cache: (obj) => {
      return allPapersHandler.write(obj);
    },
  };
}

/**
 * 全てのバージョンのメタ情報を収集
 */
async function loadAllVersion() {
  const jsonTxt = (await new Url(paperAllVersionsURL).into(Bytes)).onOk((val) =>
    val.toStr()
  );
  if (jsonTxt.isErr) return jsonTxt;

  // json文字列をパース（エラーの可能性があるためResultでラップ）
  return Result.catchSync(() =>
    paperAllVersionsZod.parse(JSON.parse(jsonTxt.value()))
  );
}

/**
 * メタ情報から当該バージョンのオブジェクトを生成
 */
async function loadEachVersion(
  versionName: string
): Promise<Result<AllPapermcVersion[number]>> {
  const jsonTxt = (
    await new Url(paperEachVersionURL(versionName)).into(Bytes)
  ).onOk((v) => v.toStr());
  if (jsonTxt.isErr) return jsonTxt;

  const parsedEachVerJson = Result.catchSync(() =>
    paperEachVersionZod.parse(JSON.parse(jsonTxt.value()))
  );
  if (parsedEachVerJson.isErr) return parsedEachVerJson;

  return ok({
    id: parsedEachVerJson.value().version,
    builds: parsedEachVerJson.value().builds,
  });
}