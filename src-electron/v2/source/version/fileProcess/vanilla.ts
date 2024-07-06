import { z } from 'zod';
import { serverSourcePath } from 'app/src-electron/v2/core/const';
import { minecraftRuntimeVersions } from 'app/src-electron/v2/schema/runtime';
import {
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
      const cacheDir = getCacheVerFolderPath(version);

      // バージョンに関する基本情報を取得
      const verJson = await getVersionJson(version);
      if (verJson.isErr) {
        return verJson;
      }

      // `server.jar`や`libraries`を取得し，要求されたパスに配置する
      const jarRes = await setJar(cacheDir, path, verJson.value());
      if (jarRes.isErr) {
        return jarRes;
      }

      return ok({
        runtime: {
          type: 'minecraft' as const,
          version: verJson.value().javaVersion?.component ?? 'jre-legacy',
        },
        getCommand: (option: { jvmArgs: string[] }) => {
          return replaceEmbedArgs(verJson.value().arguments, {
            JAR_PATH: [getVersionJsonPath(path).toStr()],
            JVM_ARGUMENT: option.jvmArgs,
          });
        },
      });
    },
    removeVersionFile: async (version, path) => {
      const cacheDir = getCacheVerFolderPath(version);

      const cacheJarPath = getJarPath(cacheDir);
      const cachelibPath = cacheDir.child('libraries');
      const cacheEulaPath = cacheDir.child('eula.txt');
      const removeJarPath = getJarPath(path);
      const removelibPath = path.child('libraries');
      const removeEulaPath = path.child('eula.txt');

      // キャッシュにデータを戻す
      await removeJarPath.copyTo(cacheJarPath);
      await removelibPath.copyTo(cachelibPath);
      await removeEulaPath.copyTo(cacheEulaPath);

      // 実行時のバージョンデータを削除
      await removeJarPath.remove();
      await removelibPath.remove();
      await removeEulaPath.remove();

      return ok();
    },
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
  if (!Object.keys(verJsonHandlers).some((vId) => vId === version.id)) {
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
 * Jarファイルを所定の位置にセットする
 *
 * Jarのキャッシュがない場合はダウンロードデータをセットする
 */
async function setJar(
  cachePath: Path,
  targetPath: Path,
  info: VersionJson
): Promise<Result<void>> {
  const cacheJarPath = getJarPath(cachePath);
  const cachelibPath = cachePath.child('libraries');
  const cacheEulaPath = cachePath.child('eula.txt');
  // Jarをセット
  if (cacheJarPath.exists()) {
    await cacheJarPath.copyTo(getJarPath(targetPath));
    // libs, eulaはあってもなくても良いため，チェックせずにコピーしようとさせる
    await cachelibPath.copyTo(targetPath.child('libraries'));
    await cacheEulaPath.copyTo(targetPath.child('eula.txt'));
  } else {
    const downloadJar = await new Url(info.download.url).into(Bytes);
    if (downloadJar.isErr) {
      return downloadJar;
    }

    // JarのHashを確認
    const downloadJarHash = (await downloadJar.value().into(SHA1)).onOk(
      (hash) => {
        if (info.download.sha1 === hash) {
          return ok(hash);
        } else {
          return err(new Error('DOWNLOAD_INVALID_SERVER_JAR'));
        }
      }
    );
    if (downloadJarHash.isErr) {
      return downloadJarHash;
    }

    // ダウンロードしたJarデータを書き出し
    const jarPath = getJarPath(targetPath);
    await jarPath.mkdir();
    return await downloadJar.value().into(jarPath);
  }

  return ok();
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
