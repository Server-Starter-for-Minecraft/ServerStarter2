/**
 * 当該バージョンのJarに関する情報に関するプログラム
 *
 * 各バージョンフォルダ内の`version.json`がこの情報を格納する
 */
import { z } from 'zod';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { Version } from 'app/src-electron/v2/schema/version';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';

const embedTypes = ['JVM_ARGUMENT', 'JAR_PATH', 'LOG4J_ARG'] as const;
const JarArgsZod = z.string().or(
  z.object({
    embed: z.enum(embedTypes),
  })
);

const javaVersionZod = z.object({
  component: z.string().optional(),
  majorVersion: z.number().optional(),
});
const VersionJsonZod = z.object({
  download: z.object({
    url: z.string(),
    hash: z.string().optional(),
  }),
  javaVersion: javaVersionZod.optional(),
  arguments: JarArgsZod.array(),
});

type EmbedType = (typeof embedTypes)[number];
export type VerJsonArg = z.infer<typeof JarArgsZod>;
export type JavaVersionInfo = z.infer<typeof javaVersionZod>;
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
  cacheFolder: Path,
  verType: Version['type'],
  serverID: string
) {
  return JsonSourceHandler.fromPath(
    getVersionJsonPath(cacheFolder.child(`${verType}/${serverID}`)),
    VersionJsonZod
  );
}

/**
 * `version.json`に書き込むオブジェクトを生成
 *
 * @param downloadURL JarをダウンロードするURL
 * @param containJarArgs 戻り値の中の`arguments`にJar関連の引数を入れるか
 * @param jarSha1 JarのSHA1が判明している場合は，登録しておくことでJarの配置時にJarの検証が行われる
 * @param javaVer Jarを実行するJavaのバージョンを指定する
 * @param customArgs 規定値の引数以外に引数を登録しておきたい場合に指定する
 *
 */
export function getVersionJsonObj(
  downloadURL: string,
  containJarArgs: boolean,
  jarSha1?: string,
  javaVer?: VersionJson['javaVersion'],
  customArgs?: string[]
): VersionJson {
  const _customArgs: VersionJson['arguments'] = deepcopy(customArgs) ?? [];
  if (containJarArgs) {
    _customArgs.push('-jar');
    _customArgs.push({ embed: 'JAR_PATH' });
  }

  // 引数群
  const args: VersionJson['arguments'] = [
    { embed: 'JVM_ARGUMENT' },
    javaEncodingToUtf8(),
    { embed: 'LOG4J_ARG' },
    ..._customArgs,
    '--nogui',
  ];

  const returnObj: VersionJson = {
    download: {
      url: downloadURL,
      hash: jarSha1,
    },
    arguments: args,
  };

  if (javaVer) {
    returnObj['javaVersion'] = javaVer;
  }

  return returnObj;
}

/** stdin,stdout,stderrの文字コードをutf-8に */
export function javaEncodingToUtf8() {
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
    const replaceIdx = returnArgs.findIndex(
      (arg) => typeof arg !== 'string' && arg['embed'] === embedType
    );

    if (replaceIdx !== -1) {
      returnArgs.splice(replaceIdx, 1, ...replaceValue[embedType]);
    }
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
        hash: '',
      },
      arguments: [
        { embed: 'JVM_ARGUMENT' },
        { embed: 'LOG4J_ARG' },
        '-Dlog4j2.formatMsgNoLookups=true',
        '-jar',
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
