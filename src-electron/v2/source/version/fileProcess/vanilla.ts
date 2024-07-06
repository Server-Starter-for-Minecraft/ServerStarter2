import { z } from 'zod';
import { serverSourcePath } from 'app/src-electron/v2/core/const';
import {
  minecraftRuntimeVersions,
  Runtime,
} from 'app/src-electron/v2/schema/runtime';
import {
  UnknownVersion,
  VanillaVersion,
  Version,
  VersionId,
} from 'app/src-electron/v2/schema/version';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { SHA1 } from 'app/src-electron/v2/util/binary/hash';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import {
  getCacheVerFolderPath,
  getJarPath,
  ServerVersionFileProcess,
} from '../fileProcess/base';
import { getVersionMainfest } from '../getVersions/mainfest';
import { checkJarHash, removeJars, setJar } from './serverJar';
import {
  generateVersionJsonHandler,
  getVersionJsonObj,
  getVersionJsonPath,
  replaceEmbedArgs,
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
): Promise<Result<VersionJson>> {
  // 取得したJSONのパース用型定義
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
      getVersionJsonObj(
        version,
        obj.downloads.server.url,
        obj.downloads.server.sha1,
        obj.javaVersion
      )
    )
    .parseAsync(metaObj);
}

export function getVanillaFp(): ServerVersionFileProcess<VanillaVersion> {
  return {
    setVersionFile: async (version, path, readyRuntime) => {
      // TODO: リファクタリング
      // １．キャッシュ関連の処理（＝`version.json`の生成，各種ファイルの生成，チェック）
      // ２．キャッシュデータを所定の位置に格納
      // に分離し，それぞれの処理を確実に記述するための型定義を実施する
      const cacheDir = getCacheVerFolderPath(version);

      // バージョンに関する基本情報を取得
      const verJson = await getVanillaVersionJson(version);
      if (verJson.isErr) {
        return verJson;
      }

      // `server.jar`や`libraries`を取得し，要求されたパスに配置する
      const jarRes = await setJar(cacheDir, path, (targetJarPath) =>
        downloadJar(
          targetJarPath,
          verJson.value().download.url,
          verJson.value().download.sha1
        )
      );
      if (jarRes.isErr) return jarRes;

      return ok({
        runtime: {
          type: 'minecraft',
          version: verJson.value().javaVersion?.component ?? 'jre-legacy',
        } as Runtime,
        getCommand: (option: { jvmArgs: string[] }) => {
          return replaceEmbedArgs(verJson.value().arguments, {
            JAR_PATH: [getVersionJsonPath(path).toStr()],
            JVM_ARGUMENT: option.jvmArgs,
          });
        },
      });
    },
    removeVersionFile: (version, path) => {
      const cacheDir = getCacheVerFolderPath(version);
      return removeJars(path, cacheDir);
    },
  };
}

/**
 * バニラの`version.json`の内容を読み取って，必要な情報を取得する
 *
 * `version.json`が存在しない場合は新しく生成する
 *
 * バニラのバージョン情報をもとにほかのサーバーを起動するため，`export`している
 */
export async function getVanillaVersionJson(
  version: Version
): Promise<Result<VersionJson>> {
  if (version.type === 'unknown')
    return err(new Error('NO_VERSION_JSON_IN_UNKNOWN_VERSION'));

  // Handlerを生成して登録する
  if (!Object.keys(verJsonHandlers).some((vId) => vId === version.id)) {
    verJsonHandlers[version.id] = generateVersionJsonHandler(
      'vanilla',
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
  const verJson = await vanillaMetaInfo2VersionJson(
    version,
    JSON.parse(jsonStr.value())
  );
  if (verJson.isErr) {
    return verJson;
  }

  verJsonHandlers[version.id].write(verJson.value());
  return verJson;
}

/**
 * 新しくJarをダウンロードする
 */
async function downloadJar(
  targetJarPath: Path,
  downloadURL: string,
  correctHash?: string
) {
  const downloadJar = await new Url(downloadURL).into(Bytes);
  if (downloadJar.isErr) return downloadJar;

  // JarのHashを確認
  if (correctHash) {
    const downloadHash = await checkJarHash(downloadJar.value(), correctHash);
    if (downloadHash?.isErr) return downloadHash;
  }

  return await downloadJar.value().into(targetJarPath);
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  const ver21: VanillaVersion = {
    id: '1.21' as VersionId,
    type: 'vanilla',
    release: true,
  };

  test('metaJsonParser', async () => {
    const urlFromManifest =
      'https://piston-meta.mojang.com/v1/packages/177e49d3233cb6eac42f0495c0a48e719870c2ae/1.21.json';

    const jsonStr = (await new Url(urlFromManifest).into(Bytes)).onOk((val) =>
      val.toStr()
    );
    if (jsonStr.isErr) {
      return jsonStr;
    }

    // JSON情報を変換して`version.json`に書き込めるオブジェクトを生成
    const verJson = await vanillaMetaInfo2VersionJson(
      ver21,
      JSON.parse(jsonStr.value())
    );

    expect(verJson.isOk).toBe(true);
    expect(verJson.value().javaVersion?.component).toEqual(
      'java-runtime-delta'
    );
  });

  test('setVersionJar', async () => {
    const outputPath = serverSourcePath.child('test/ver21');
    const cachePath = getCacheVerFolderPath(ver21);

    // 条件をそろえるために，ファイル類を削除する
    await outputPath.remove();
    await cachePath?.remove();

    const fp = getVanillaFp();
    const res = await fp.setVersionFile(ver21, outputPath, async (runtime) =>
      ok()
    );

    // 戻り値の検証
    expect(res.isOk).toBe(true);
    expect(res.value().getCommand({ jvmArgs: ['replaceArg'] })[0]).toBe(
      'replaceArg'
    );

    // ファイルの設置状況の検証
    expect(getJarPath(outputPath).exists()).toBe(true);
    // Jarを実行しないと生成されないため，今回はTestの対象外
    // expect(outputPath.child('libraries').exists()).toBe(true);

    // 実行後にファイル削除
    await fp.removeVersionFile(ver21, outputPath);

    // 削除後の状態を確認
    expect(getJarPath(outputPath).exists()).toBe(false);
    expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
  });
}
