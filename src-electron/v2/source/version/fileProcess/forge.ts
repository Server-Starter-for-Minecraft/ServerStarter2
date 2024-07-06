import { deepcopy } from 'app/src-electron/util/deepcopy';
import { Runtime } from 'app/src-electron/v2/schema/runtime';
import { ForgeVersion, VersionId } from 'app/src-electron/v2/schema/version';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { getCacheVerFolderPath, ServerVersionFileProcess } from './base';
import { setJar } from './serverJar';
import { getVanillaVersionJson } from './vanilla';
import {
  generateVersionJsonHandler,
  getVersionJsonPath,
  replaceEmbedArgs,
  VersionJson,
} from './versionJson';

const verJsonHandlers: { [vId in VersionId]: JsonSourceHandler<VersionJson> } =
  {};

export function getForgeFp(): ServerVersionFileProcess<ForgeVersion> {
  return {
    async setVersionFile(version, path, readyRuntime) {
      const cacheDir = getCacheVerFolderPath(version);

      // バージョンに関する基本情報を取得
      const verJson = await getForgeVersionJson(version);
      if (verJson.isErr) return verJson;

      // `server.jar`や`libraries`を取得し，要求されたパスに配置する
      const jarRes = await setJar(cacheDir, path, (targetJarPath) =>
        readyNewJar()
      );
      if (jarRes.isErr) {
        return jarRes;
      }

      // JarのインストールによってVersion情報にアップデートが入ることがあるため，再取得する
      const updatedVerJson = await getForgeVersionJson(version);
      if (updatedVerJson.isErr) return updatedVerJson;

      return ok({
        runtime: {
          type: 'minecraft',
          version:
            updatedVerJson.value().javaVersion?.component ?? 'jre-legacy',
        } as Runtime,
        getCommand: (option: { jvmArgs: string[] }) => {
          return replaceEmbedArgs(updatedVerJson.value().arguments, {
            JAR_PATH: [getVersionJsonPath(path).toStr()],
            JVM_ARGUMENT: option.jvmArgs,
          });
        },
      });
    },
    async removeVersionFile(version, path) {},
  };
}

/**
 * Forge版の`version.json`を読み取る
 *
 * 存在しない場合はバニラ側のデータをもとに生成する
 */
async function getForgeVersionJson(
  version: ForgeVersion
): Promise<Result<VersionJson>> {
  // Handlerを生成して登録する
  if (!Object.keys(verJsonHandlers).some((vId) => vId === version.id)) {
    verJsonHandlers[version.id] = generateVersionJsonHandler(
      version.type,
      version.id,
      version.forge_version
    );
  }

  // versionJsonを読み取って，問題なければこの情報を返す
  const verJsonRes = await verJsonHandlers[version.id].read();
  if (verJsonRes.isOk) {
    return verJsonRes;
  }

  // 問題がある（存在しなかった）場合は，バニラの情報をもとにversionJsonを生成
  const vanillaVerJson = await getVanillaVersionJson(version);
  if (vanillaVerJson.isErr) return vanillaVerJson;

  // ダウンロードURLを更新
  const returnVerJson = deepcopy(vanillaVerJson.value());
  returnVerJson.download = { url: version.download_url };

  return ok(returnVerJson);
}

/**
 * ForgeのJarを新しく準備する
 *
 * また，準備する過程で生成したコマンドの引数をversionJsonに格納する
 */
async function readyNewJar(targetJarPath: Path, version: ForgeVersion) {}

/**
 * Jarの新規インストールの過程で生成された引数群を保存する
 */
async function updateCacheArgs(versionId: VersionId, args: string[]) {
  const handler = verJsonHandlers[versionId];
  const cached = await handler.read();
  if (cached.isErr) return err(new Error('FAILED_READ_VERSION_JSON'));

  const updatedCache = deepcopy(cached.value());
  // TODO: `updatedCache`のargsを更新




  return handler.write(updatedCache);
}
