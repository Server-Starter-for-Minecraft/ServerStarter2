import { z } from 'zod';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { Runtime } from 'app/src-electron/v2/schema/runtime';
import { SpigotVersion, VersionId } from 'app/src-electron/v2/schema/version';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { getRuntimeObj } from './serverJar';
import { getVanillaVersionJson } from './vanilla';
import { javaEncodingToUtf8, VersionJson } from './versionJson';

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
  protected async generateVersionJson(): Promise<Result<VersionJson>> {
    // バニラの情報をもとにSpigotのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (vanillaVerJson.isErr) return vanillaVerJson;

    // 実行に必要なJavaのバージョンのJsonを取得
    const jsonTxt = (
      await new Url(spigotVerInfoURL(this._version)).into(Bytes)
    ).onOk((v) => v.toStr());
    if (jsonTxt.isErr) return jsonTxt;

    // 取得したJsonをパース
    const spigotVerInfo = Result.catchSync(() =>
      spigotVerInfoZod.parse(JSON.parse(jsonTxt.value()))
    );
    if (spigotVerInfo.isErr) return spigotVerInfo;

    // verJsonを更新
    const returnVerJson = deepcopy(vanillaVerJson.value());
    returnVerJson.download = {
      url: SPIGOT_BUILDTOOL_URL,
    };
    returnVerJson.javaVersion = {
      majorVersion: spigotVerInfo.value().javaVersions[1],
    };
    return ok(returnVerJson);
  }
  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime
  ): Promise<Result<void>> {
    const verJson = await verJsonHandler.read();
    if (verJson.isErr) return verJson;

    // `BuildTools.jar`をダウンロード
    const installerPath = this.cachePath.child('build/BuildTools.jar');
    const installerRes = await downloadBuildTools(
      verJson.value().download.url,
      installerPath
    );
    if (installerRes.isErr) return installerRes;

    const runtime = await this.getRuntime(verJsonHandler);
    if (runtime.isErr) return runtime;

    // `BuildTools.jar`を実行して，`server.jar`を抽出
    return getServerJarFromBuildTools(
      this._version.id,
      installerPath,
      this.cachePath,
      runtime.value(),
      execRuntime
    );
  }
  protected async getRuntime(
    verJsonHandler: JsonSourceHandler<VersionJson>
  ): Promise<Result<Runtime>> {
    const verJson = await verJsonHandler.read();
    if (verJson.isErr) return verJson;

    return getRuntimeObj('universal', verJson.value().javaVersion);
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
): Promise<Result<void>> {
  await buildToolsPath.parent().mkdir();

  // BuildTools.jarをダウンロード
  const downloadJar = await new Url(downloadURL).into(Bytes);
  if (downloadJar.isErr) return downloadJar;

  // generateVersionJsonHandler()において，BuildTools.jarのHashを書き込んでいないため，Hashのチェックは省略
  // `BuildTools.jar`を書き出し
  const writeRes = await downloadJar.value().into(buildToolsPath);
  if (writeRes.isErr) return writeRes;

  return ok();
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
): Promise<Result<void>> {
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

  if (buildRes.isErr) return buildRes;

  // (インストーラーを実行して，Jarファイルを生成)

  // jarをリネーム
  const sourceJarPath = buildToolsPath
    .parent()
    .child(`spigot-${versionId}.jar`);
  const targetJarPath = getJarPath(serverCachePath);
  await sourceJarPath.rename(targetJarPath);

  // 余計なファイルを削除
  await buildToolsPath.parent().remove();

  return ok();
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('', async () => {
    const { Path } = await import('src-electron/v2/util/binary/path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child('work');
    workPath.mkdir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver21: SpigotVersion = {
      id: '1.21' as VersionId,
      type: 'spigot',
    };

    test('setSpigotJar', async () => {
      const outputPath = serverFolder.child('testSpigot/ver21');
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
        return ok();
      });

      // テスト対象の関数
      const res = await readyOperator.completeReady4VersionFiles(
        outputPath,
        execRuntime
      );

      // 戻り値の検証
      expect(res.isOk).toBe(true);
      expect(res.value().getCommand({ jvmArgs: ['replaceArg'] })[0]).toBe(
        'replaceArg'
      );

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
