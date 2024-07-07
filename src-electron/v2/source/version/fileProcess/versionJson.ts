/**
 * 当該バージョンのJarに関する情報に関するプログラム
 *
 * 各バージョンフォルダ内の`version.json`がこの情報を格納する
 */
import { z } from 'zod';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { versionsCachePath } from 'app/src-electron/v2/core/const';
import { minecraftRuntimeVersions } from 'app/src-electron/v2/schema/runtime';
import { Version, VersionId } from 'app/src-electron/v2/schema/version';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';

const embedTypes = ['JVM_ARGUMENT', 'JAR_PATH', 'LOG4J_ARG'] as const;
const JarArgsZod = z.string().or(
  z.object({
    embed: z.enum(embedTypes),
  })
);

const VersionJsonZod = z.object({
  download: z.object({
    url: z.string(),
    sha1: z.string().optional(),
  }),
  javaVersion: z
    .object({
      component: z.enum(minecraftRuntimeVersions),
      majorVersion: z.number(),
    })
    .optional(),
  arguments: JarArgsZod.array(),
});

type EmbedType = (typeof embedTypes)[number];
export type VerJsonArg = z.infer<typeof JarArgsZod>;
export type VersionJson = z.infer<typeof VersionJsonZod>;

/**
 * サーバーJarに関する情報をもつJSONのパスを返す
 */
export function getVersionJsonPath(cwdPath: Path) {
  return cwdPath.child('version.json');
}

/**
 * `version.json`のHandlerを生成する
 *
 * @param childDirs VersionID以下にビルド番号のようなさらに細かいフォルダ分けが必要な時，仕分け順にフォルダ名のリストを渡す
 */
export function generateVersionJsonHandler(
  verType: Version['type'],
  verId: VersionId,
  ...childDirs: string[]
) {
  const childPath = [`${verType}`, verId];
  childPath.push(...childDirs);

  return JsonSourceHandler.fromPath(
    getVersionJsonPath(versionsCachePath.child(childPath.join('/'))),
    VersionJsonZod
  );
}

/**
 * `version.json`に書き込むオブジェクトを生成
 */
export async function getVersionJsonObj(
  downloadURL: string,
  jarSha1?: string,
  javaVer?: VersionJson['javaVersion']
): Promise<Result<VersionJson>> {
  // 引数群
  const args: VersionJson['arguments'] = [
    { embed: 'JVM_ARGUMENT' },
    javaEncodingToUtf8(),
    { embed: 'LOG4J_ARG' },
    '--jar',
    { embed: 'JAR_PATH' },
    '--nogui',
  ];

  const returnObj: VersionJson = {
    download: {
      url: downloadURL,
      sha1: jarSha1,
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

/**
 * versionJsonの`embed`を置換する処理
 */
export function replaceEmbedArgs(
  args: VerJsonArg[],
  replaceValue: Record<EmbedType, string[]>
) {
  const returnArgs = deepcopy(args);

  (Object.keys(replaceValue) as EmbedType[]).forEach((embedType) => {
    const replaceIdx = args.findIndex(
      (arg) => typeof arg !== 'string' && arg['embed'] === embedType
    );

    returnArgs.splice(replaceIdx, 1, ...replaceValue[embedType]);
  });

  return returnArgs as string[];
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('versionJson_replaceEmbedArgs', () => {
    const baseVerJsonDummy: VersionJson = {
      download: {
        url: 'https://piston-data.mojang.com/v1/objects/8dd1a28015f51b1803213892b50b7b4fc76e594d/server.jar',
        sha1: '',
      },
      arguments: [
        { embed: 'JVM_ARGUMENT' },
        { embed: 'LOG4J_ARG' },
        '-Dlog4j2.formatMsgNoLookups=true',
        '--jar',
        { embed: 'JAR_PATH' },
        '--nogui',
      ],
    };

    const replacedArgs = replaceEmbedArgs(baseVerJsonDummy.arguments, {
      JAR_PATH: ['dummyPath'],
      JVM_ARGUMENT: ['replaceTest'],
      LOG4J_ARG: ['log4J_ARG'],
    });
    // 戻り値はReplaceされている
    expect(replacedArgs[0]).toBe('replaceTest');
    // 元データは変更しない
    expect(baseVerJsonDummy.arguments[0]).toBeTypeOf('object');
  });
}
