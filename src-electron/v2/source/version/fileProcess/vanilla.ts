import { z } from 'zod';
import { minecraftRuntimeVersions } from 'app/src-electron/v2/schema/runtime';
import {
  VanillaVersion,
  Version,
  VersionId,
} from 'app/src-electron/v2/schema/version';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import {
  getCacheVerFolderPath,
  ServerVersionFileProcess,
} from '../fileProcess/base';
import { getVersionMainfest } from '../getVersions/mainfest';
import {
  generateVersionJsonHandler,
  getVersionJsonObj,
  VersionJson,
} from './versionJson';

const verJsonHandlers: { [vId in VersionId]: JsonSourceHandler<VersionJson> } =
  {};

/**
 * manifestのURLから取得される各バージョンのJSON情報を`version.json`の内容に変換
 */
function vanillaMetaInfo2VersionJson(
  version: Version,
  metaObj: Record<string, any>
) {
  const metaInfoZod = z.object({
    downloads: z.object({
      server: z.object({
        sha1: z.string(),
        size: z.number(),
        url: z.string(),
      }),
    }),
    javaVersion: z
      .object({
        component: z.enum(minecraftRuntimeVersions),
        majorVersion: z.number(),
      })
      .optional(),
  });

  return metaInfoZod
    .transform((obj) =>
      getVersionJsonObj(version, obj.downloads.server.url, obj.javaVersion)
    )
    .parse(metaObj);
}

export function getVanillaFp(): ServerVersionFileProcess<VanillaVersion> {
  return {
    setVersionFile: async (version, path, readyRuntime) => {
      const cacheDir = getCacheVerFolderPath(version);
      if (!cacheDir) {
        return err(new Error('VERSION_IS_UNKNOWN'));
      }

      // バージョンに関する基本情報を取得
      const verJson = await getVersionJson(version);
      if (verJson.isErr) {
        return verJson;
      }

      // TODO: `server.jar`や`libraries`を取得し，要求されたパスに配置する
      // `server.jar`や`libraries`がキャッシュに存在しないときはDLし，キャッシュにもDLしたJarを配置する

      return ok({
        runtime: {
          type: 'minecraft' as const,
          version: verJson.value().javaVersion?.component ?? 'jre-legacy',
        },
        getCommand: (option: { jvmArgs: string[] }) => {
          // TODO: { "embed": "JVM_ARGUMENT" }をjvmArgsで置換したうえで，最終的なArgsを返す
          // 置換処理は`versionJson.ts`で一般化すると良い
          return [];
        },
      });
    },
    removeVersionFile: (path) => {},
  };
}

/**
 * `version.json`の内容を読み取って，必要な情報を取得する
 *
 * `version.json`が存在しない場合は新しく生成する
 *
 * TODO: versionJson.tsに移築して一般化？
 */
async function getVersionJson(
  version: VanillaVersion
): Promise<Result<VersionJson>> {
  // Handlerを生成して登録する
  if (Object.keys(verJsonHandlers).some((vId) => vId === version.id)) {
    verJsonHandlers[version.id] = generateVersionJsonHandler(
      version.type,
      version.id
    );
  }

  // versionJsonを読み取って，問題なければこの情報を返す
  const verJsonRes = await verJsonHandlers[version.id].read();
  if (verJsonRes.isOk) {
    return verJsonRes;
  }

  // 問題がある（存在しなかった）場合は，versionJsonを生成する
  const manifest = await getVersionMainfest();
  if (manifest.isErr) {
    return manifest;
  }

  // 当該バージョンに関するManifestを取得
  const verManifest = manifest
    .value()
    .versions.find((v) => version.id === v.id);
  if (!verManifest) {
    return err(new Error('NOT_FOUND_VERSION_IN_MANIFEST'));
  }

  // manifestのURLから取得される各バージョンのJSON情報
  const jsonStr = (await new Url(verManifest.url).into(Bytes)).onOk((val) =>
    val.toStr()
  );
  if (jsonStr.isErr) {
    return jsonStr;
  }

  // JSON情報を変換して`version.json`に書き込めるオブジェクトを生成
  const verJson = vanillaMetaInfo2VersionJson(
    version,
    JSON.parse(jsonStr.value())
  );
  if (verJson.isErr) {
    return verJson;
  }

  verJsonHandlers[version.id].write(verJson.value());
  return verJson;
}
