/**
 * 当該バージョンのJarに関する情報に関するプログラム
 *
 * 各バージョンフォルダ内の`version.json`がこの情報を格納する
 */
import { z } from 'zod';
import { versionsCachePath } from 'app/src-electron/v2/core/const';
import { minecraftRuntimeVersions } from 'app/src-electron/v2/schema/runtime';
import { Version, VersionId } from 'app/src-electron/v2/schema/version';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { getCacheVerFolderPath } from './base';
import { getLog4jArg } from './log4j';

const JarArgsZod = z.string().or(
  z.object({
    embed: z.enum(['JVM_ARGUMENT', 'JAR_PATH']),
  })
);

const VersionJsonZod = z.object({
  download: z.object({
    url: z.string(),
  }),
  javaVersion: z
    .object({
      component: z.enum(minecraftRuntimeVersions),
      majorVersion: z.number(),
    })
    .optional(),
  arguments: JarArgsZod.array(),
});

export type VersionJson = z.infer<typeof VersionJsonZod>;

/**
 * サーバーJarに関する情報をもつJSONのパスを返す
 */
export function getVersionJsonPath(cwdPath: Path) {
  return cwdPath.child('version.json');
}

/**
 * `version.json`のHandlerを生成する
 */
export function generateVersionJsonHandler(
  verType: Version['type'],
  verId: VersionId
) {
  return JsonSourceHandler.fromPath(
    getVersionJsonPath(versionsCachePath.child(`${verType}/${verId}`)),
    VersionJsonZod
  );
}

/**
 * `version.json`に書き込むオブジェクトを生成
 */
export async function getVersionJsonObj(
  version: Version,
  downloadURL: string,
  javaVer?: VersionJson['javaVersion']
): Promise<Result<VersionJson>> {
  const baseCacheFolder = getCacheVerFolderPath(version);
  if (!baseCacheFolder) {
    return err(new Error('VERSION_IS_UNKNOWN'));
  }

  const log4jArg = await getLog4jArg(baseCacheFolder, version);
  if (log4jArg.isErr) {
    return log4jArg;
  }

  // 最初に記載する引数群
  const args: VersionJson['arguments'] = [
    { embed: 'JVM_ARGUMENT' },
    javaEncodingToUtf8(),
  ];
  // 条件によって入るか否かが変化するものをIfで分岐して挿入
  const log4jArgVal = log4jArg.value();
  if (log4jArgVal !== null) {
    args.push(log4jArgVal);
  }
  // 最後に記載する引数群
  args.push('--jar', { embed: 'JAR_PATH' }, '--nogui');

  const returnObj: VersionJson = {
    download: {
      url: downloadURL,
    },
    arguments: args,
  };

  if (javaVer) {
    returnObj['javaVersion'] = javaVer;
  }

  return ok(returnObj);
}

/** stdin,stdout,stderrの文字コードをutf-8に */
function javaEncodingToUtf8() {
  return '-Dfile.encoding=UTF-8';
}
