import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { Runtime } from 'app/src-electron/schema/runtime';
import { SpigotVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { isError } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { javaEncodingToUtf8, VersionJson } from './utils/versionJson';
import { getVanillaVersionJson } from './vanilla';

// 各バージョンの情報を取得する
const spigotVerInfoURL = (v: SpigotVersion) =>
  `https://hub.spigotmc.org/versions/${v.id}.json`;
const spigotVerInfoZod = z.object({
  name: z.string(),
  description: z.string(),
  refs: z.object({
    BuildData: z.string(),
    Bukkit: z.string(),
    CraftBukkit: z.string(),
    Spigot: z.string(),
  }),
  toolsVersion: z.number(),
  javaVersions: z.number().array().length(2),
});

// Spigotのビルドツール
const SPIGOT_BUILDTOOL_URL =
  'https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar';

function getServerID(version: SpigotVersion) {
  return `${version.id}`;
}

// ReadyVersionの標準対応以外のキャッシュからコピーすべきファイル群
const SUPPORT_SECONDARY_FILES = ['bundler'];

export class ReadySpigotVersion extends ReadyVersion<SpigotVersion> {
  constructor(version: SpigotVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder, SUPPORT_SECONDARY_FILES);
  }

  protected async generateVersionJson(): Promise<Failable<VersionJson>> {
    // バニラの情報をもとにSpigotのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (isError(vanillaVerJson)) return vanillaVerJson;

    // 実行に必要なJavaのバージョンのJsonを取得
    const jsonBytes = await BytesData.fromURL(spigotVerInfoURL(this._version));
    if (isError(jsonBytes)) return jsonBytes;

    // 取得したJsonをパース
    const spigotVerInfo = await jsonBytes.json(spigotVerInfoZod);
    if (isError(spigotVerInfo)) return spigotVerInfo;

    // verJsonを更新
    const returnVerJson = deepcopy(vanillaVerJson);
    returnVerJson.download = {
      url: SPIGOT_BUILDTOOL_URL,
    };
    returnVerJson.javaVersion = {
      majorVersion: spigotVerInfo.javaVersions[1],
    };
    return returnVerJson;
  }

  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime
  ): Promise<Failable<void>> {
    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    // `BuildTools.jar`をダウンロード
    const installerPath = this.cachePath.child('build/BuildTools.jar');
    const installerRes = await downloadBuildTools(
      verJson.download.url,
      installerPath
    );
    if (isError(installerRes)) return installerRes;

    const runtime = await this.getRuntime('minecraft', verJsonHandler);
    if (isError(runtime)) return runtime;

    // `BuildTools.jar`を実行して，`server.jar`を抽出
    return getServerJarFromBuildTools(
      this._version.id,
      installerPath,
      this.cachePath,
      runtime,
      execRuntime
    );
  }

  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveSpigotVersion extends RemoveVersion<SpigotVersion> {
  constructor(version: SpigotVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder, SUPPORT_SECONDARY_FILES);
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

/**
 * SpigotのJarを入手するために必要な`BuildTools.jar`を入手
 */
async function downloadBuildTools(
  downloadURL: string,
  buildToolsPath: Path
): Promise<Failable<void>> {
  await buildToolsPath.parent().mkdir();

  // BuildTools.jarをダウンロード
  const downloadJar = await BytesData.fromURL(downloadURL);
  if (isError(downloadJar)) return downloadJar;

  // generateVersionJsonHandler()において，BuildTools.jarのHashを書き込んでいないため，Hashのチェックは省略
  // `BuildTools.jar`を書き出し
  return buildToolsPath.write(downloadJar);
}

/**
 * 入手した`BuildTools.jar`を実行して`server.jar`を書き出す
 */
async function getServerJarFromBuildTools(
  versionId: VersionId,
  buildToolsPath: Path,
  serverCachePath: Path,
  runtime: Runtime,
  execRuntime: ExecRuntime
): Promise<Failable<void>> {
  // `BuildTools.jar`の実行引数（普通の`server.jar`の実行引数とは異なるため，決め打ちで下記に実装）
  const args = [
    javaEncodingToUtf8(),
    '-jar',
    buildToolsPath.absolute().quotedPath,
    '--rev',
    versionId,
  ];

  const buildRes = await execRuntime({
    runtime,
    args,
    currentDir: buildToolsPath.parent(),
    onOut(line) {
      /** TODO: プログレスに出力 */
    },
  });

  if (isError(buildRes)) return buildRes;

  // (インストーラーを実行して，Jarファイルを生成)

  // jarをリネーム
  const sourceJarPath = buildToolsPath
    .parent()
    .child(`spigot-${versionId}.jar`);
  const targetJarPath = getJarPath(serverCachePath);
  await sourceJarPath.rename(targetJarPath);

  // 余計なファイルを削除
  return buildToolsPath.parent().remove();
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect, vi } = import.meta.vitest;

  describe('spigot version', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver21: SpigotVersion = {
      id: VersionId.parse('1.21'),
      type: 'spigot',
    };

    test('setSpigotJar', async () => {
      const outputPath = serverFolder.child(ver21.id);
      const readyOperator = new ReadySpigotVersion(ver21, cacheFolder);
      const cachePath = readyOperator.cachePath;

      // 条件をそろえるために，ファイル類を削除する
      await outputPath.remove();
      // キャッシュの威力を試したいときは以下の行をコメントアウト
      await cachePath?.remove();

      // `BuildTools.jar`の実行によって必要なファイルが生成された体を再現する
      const execRuntime: ExecRuntime = vi.fn(async (options) => {
        const versionId = options.args[4];
        const tgtJarPath = options.currentDir.child(`spigot-${versionId}.jar`);
        tgtJarPath.writeText(`spigot-${versionId}.jar`);
      });

      // テスト対象の関数
      const res = await readyOperator.completeReady4VersionFiles(
        outputPath,
        execRuntime
      );
      expect(isError(res)).toBe(false);
      if (isError(res)) return;

      // 戻り値の検証
      expect(res.getCommand({ jvmArgs: ['replaceArg'] })[0]).toBe('replaceArg');

      // execRuntime が正しい引数で呼ばれている
      expect(execRuntime).toHaveBeenCalledTimes(1);
      expect(execRuntime).toHaveBeenNthCalledWith(1, {
        args: [
          '-Dfile.encoding=UTF-8',
          '-jar',
          expect.any(String),
          '--rev',
          '1.21',
        ],
        currentDir: expect.any(Path),
        onOut: expect.any(Function),
        runtime: {
          majorVersion: 66,
          type: 'universal',
        },
      });

      // ファイルの設置状況の検証
      expect(getJarPath(outputPath).exists()).toBe(true);
      // Jarを実行しないと生成されないため，今回はTestの対象外
      // expect(outputPath.child('libraries').exists()).toBe(true);

      // 実行後にファイル削除
      const remover = new RemoveSpigotVersion(ver21, cacheFolder);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      expect(getJarPath(outputPath).exists()).toBe(false);
      expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
    });
  });
}
