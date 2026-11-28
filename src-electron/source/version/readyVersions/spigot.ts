import { z } from 'zod';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { Runtime } from 'app/src-electron/schema/runtime';
import { SpigotVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { ignoreError } from 'app/src-electron/util/error/ignore';
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

  protected async generateVersionJson(
    progress?: GroupProgressor
  ): Promise<Failable<VersionJson>> {
    const p = progress?.subtitle({
      key: 'server.readyVersion.spigot.loadBuildJavaVersion',
    });

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
      // Class File Version -> JDK major version
      majorVersion: spigotVerInfo.javaVersions[1] - 44,
    };
    p?.delete();
    return returnVerJson;
  }

  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime,
    progress?: GroupProgressor
  ): Promise<Failable<void>> {
    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    // `BuildTools.jar`をダウンロード
    const p = progress?.subtitle({
      key: 'server.readyVersion.spigot.readyBuildtool',
    });
    const installerPath = this.cachePath.child('build/BuildTools.jar');
    const installerRes = await downloadBuildTools(
      verJson.download.url,
      installerPath,
      progress
    );
    if (isError(installerRes)) return installerRes;
    p?.delete();

    const runtime = await this.getRuntime(verJsonHandler);
    if (isError(runtime)) return runtime;

    // `BuildTools.jar`を実行して，`server.jar`を抽出
    return getServerJarFromBuildTools(
      this._version.id,
      installerPath,
      this.cachePath,
      runtime,
      execRuntime,
      progress
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
 *
 * ビルド作業フォルダは空の状態にしてから`BuildTools.jar`を配置する
 *
 * @param downloadURL `BuildTools.jar`のダウンロードURL
 * @param buildToolsPath `BuildTools.jar`の保存先（親フォルダは中身ごと削除して作り直す）
 * @param progress 進捗の通知先
 * @returns 失敗した場合はエラー
 */
async function downloadBuildTools(
  downloadURL: string,
  buildToolsPath: Path,
  progress?: GroupProgressor
): Promise<Failable<void>> {
  const p = progress?.subtitle({
    key: 'server.readyVersion.spigot.loadBuildData',
  });

  // BuildToolsはリポジトリのclone先が空でないと失敗するため，
  // 中断されたビルド等の残骸を削除してから作業を始める
  const buildPath = buildToolsPath.parent();
  const removeRes = await buildPath.remove();
  if (isError(removeRes)) {
    p?.delete();
    return removeRes;
  }
  await buildPath.mkdir();

  // BuildTools.jarをダウンロード
  const downloadJar = await BytesData.fromURL(downloadURL);
  p?.delete();
  if (isError(downloadJar)) return downloadJar;

  // generateVersionJsonHandler()において，BuildTools.jarのHashを書き込んでいないため，Hashのチェックは省略
  // `BuildTools.jar`を書き出し
  return buildToolsPath.write(downloadJar);
}

/**
 * 入手した`BuildTools.jar`を実行して`server.jar`を書き出す
 *
 * @param versionId ビルドするSpigotのバージョン
 * @param buildToolsPath `BuildTools.jar`のパス（親フォルダを作業フォルダとして使用し，完了後に削除する）
 * @param serverCachePath ビルドしたJarを配置するキャッシュフォルダ
 * @param runtime BuildToolsの実行に用いるJavaランタイム
 * @param execRuntime ランタイムを実行する関数
 * @param progress 進捗の通知先
 * @returns 失敗した場合はエラー
 */
async function getServerJarFromBuildTools(
  versionId: VersionId,
  buildToolsPath: Path,
  serverCachePath: Path,
  runtime: Runtime,
  execRuntime: ExecRuntime,
  progress?: GroupProgressor
): Promise<Failable<void>> {
  // BuildToolsが書き出すJarのファイル名
  // `--rev`で指定したバージョンとビルドされるMinecraftのバージョンが一致するとは限らない
  // （例：`--rev 26.1`で26.1.2がビルドされ，既定では`spigot-26.1.2.jar`となる）ため，
  // `--final-name`で出力名を固定する
  const builtJarName = `spigot-${versionId}.jar`;

  // `BuildTools.jar`の実行引数（普通の`server.jar`の実行引数とは異なるため，決め打ちで下記に実装）
  const args = [
    javaEncodingToUtf8(),
    '-jar',
    buildToolsPath.absolute().path,
    '--rev',
    versionId,
    '--final-name',
    builtJarName,
  ];

  // BuildToolsを実行して，Jarファイルを生成
  // BuildToolsの実行に用いるRuntimeは常に最新版を使用する
  const sp = progress?.subtitle({ key: 'server.readyVersion.spigot.building' });
  const cp = progress?.console();
  const buildRes = await execRuntime({
    runtime,
    args,
    currentDir: buildToolsPath.parent(),
    onOut(line) {
      cp?.push(line);
    },
  });
  sp?.delete();
  cp?.delete();
  if (isError(buildRes)) return buildRes;

  // jarをリネーム
  const p = progress?.subtitle({
    key: 'server.readyVersion.spigot.moving',
  });
  const sourceJarPath = buildToolsPath.parent().child(builtJarName);
  const targetJarPath = await getJarPath(serverCachePath);
  if (!(await sourceJarPath.exists())) {
    p?.delete();
    return errorMessage.core.version.failSpigotBuild.missingJar({
      spigotVersion: versionId,
    });
  }
  const renameRes = await sourceJarPath.rename(targetJarPath);
  if (isError(renameRes)) {
    p?.delete();
    return renameRes;
  }

  // 余計なファイルを削除
  const removed = await buildToolsPath.parent().remove();
  if (isError(removed)) {
    ignoreError(removed, '削除に失敗しても次回のビルド開始時に改めて削除する');
  }

  p?.delete();
  if (!(await targetJarPath.exists())) {
    return errorMessage.core.version.failSpigotBuild.missingJar({
      spigotVersion: versionId,
    });
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect, vi } = import.meta.vitest;

  describe('spigot version', { tags: ['network'] }, async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver19: SpigotVersion = {
      id: VersionId.parse('1.19'),
      type: 'spigot',
    };

    /**
     * BuildToolsがJarを書き出す挙動を再現する
     *
     * 実際のBuildToolsと同様に，`--final-name`の指定があればその名前で，
     * 無ければ実際にビルドしたMinecraftのバージョンをもとにした名前でJarを書き出す
     *
     * @param options BuildToolsの実行時に渡された引数
     * @param builtVersion `--rev`の指定に対して実際にビルドされるMinecraftのバージョン
     * @param content 書き出すJarの中身
     */
    async function writeBuiltJar(
      options: Parameters<ExecRuntime>[0],
      builtVersion: string,
      content: string
    ) {
      const finalNameIdx = options.args.indexOf('--final-name');
      const finalName =
        finalNameIdx >= 0 ? options.args.at(finalNameIdx + 1) : undefined;
      const jarName = finalName ?? `spigot-${builtVersion}.jar`;
      await options.currentDir.child(jarName).writeText(content);
    }

    test('setSpigotJar', { timeout: 1000 * 60 }, async () => {
      const outputPath = serverFolder.child(ver19.id);
      const readyOperator = new ReadySpigotVersion(ver19, cacheFolder);
      const cachePath = readyOperator.cachePath;

      // 条件をそろえるために，ファイル類を削除する
      await outputPath.remove();
      // キャッシュの威力を試したいときは以下の行をコメントアウト
      await cachePath?.remove();

      // `BuildTools.jar`の実行によって必要なファイルが生成された体を再現する
      // （BuildToolsに渡された引数は，ビルドするバージョンの検証のために記録する）
      let buildArgs: string[] = [];
      const execRuntime: ExecRuntime = vi.fn(async (options) => {
        buildArgs = options.args;
        await writeBuiltJar(options, ver19.id, `spigot-${ver19.id}.jar`);
      });

      // テスト対象の関数
      const res = await readyOperator.completeReady4VersionFiles(
        outputPath,
        execRuntime
      );
      expect(isError(res)).toBe(false);
      if (isError(res)) return;

      // 戻り値の検証
      expect((await res.getCommand({ jvmArgs: ['replaceArg'] }))[0]).toBe(
        'replaceArg'
      );
      expect(res.runtime).toMatchObject({
        type: 'universal',
        majorVersion: 18,
      });

      // 指定したバージョンをビルドするよう，適切なランタイムでBuildToolsが実行されている
      expect(execRuntime).toHaveBeenCalledTimes(1);
      expect(execRuntime).toHaveBeenCalledWith(
        expect.objectContaining({
          runtime: {
            type: 'universal',
            majorVersion: 18,
          },
        })
      );
      expect(buildArgs[buildArgs.indexOf('--rev') + 1]).toBe('1.19');

      // ファイルの設置状況の検証
      expect(await (await getJarPath(outputPath)).exists()).toBe(true);
      // Jarを実行しないと生成されないため，今回はTestの対象外
      // expect((await outputPath.child('libraries').exists())).toBe(true);

      // 実行後にファイル削除
      const remover = new RemoveSpigotVersion(ver19, cacheFolder);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      expect(await (await getJarPath(outputPath)).exists()).toBe(false);
      expect(cachePath && (await (await getJarPath(cachePath)).exists())).toBe(
        true
      );
    });

    test(
      'ビルド作業フォルダに前回の残骸があってもビルドできる',
      { timeout: 1000 * 60 },
      async () => {
        const outputPath = serverFolder.child(`${ver19.id}-leftover`);
        const readyOperator = new ReadySpigotVersion(ver19, cacheFolder);
        const cachePath = readyOperator.cachePath;
        await outputPath.remove();
        await (await getJarPath(cachePath)).remove();

        // 中断されたビルド等による残骸を再現する
        // （`generateCachedJar()`がBuildToolsを実行する作業フォルダと一致させること）
        // 古いJarは，前回の残骸が誤って設置されないことの確認に用いる
        const buildPath = cachePath.child('build');
        await buildPath
          .child('Spigot', 'Spigot-Server', 'pom.xml')
          .writeText('');
        await buildPath.child(`spigot-${ver19.id}.jar`).writeText('old jar');

        // BuildToolsと同様に，cloneすべきリポジトリのフォルダが空でなければ失敗する
        const repos = ['Bukkit', 'CraftBukkit', 'Spigot'];
        const execRuntime: ExecRuntime = vi.fn(async (options) => {
          for (const repo of repos) {
            const repoPath = options.currentDir.child(repo);
            const children = (await repoPath.exists())
              ? await repoPath.iter()
              : [];
            if (!isError(children) && children.length > 0) {
              return errorMessage.system.subprocess({
                processPath: 'java',
                args: options.args,
                exitcode: 1,
              });
            }
          }
          await writeBuiltJar(options, ver19.id, 'new jar');
        });

        const res = await readyOperator.completeReady4VersionFiles(
          outputPath,
          execRuntime
        );
        expect(isError(res)).toBe(false);
        // 今回ビルドしたJarが設置されているはず
        expect(await (await getJarPath(outputPath)).readText()).toBe('new jar');
      }
    );

    test(
      '指定したバージョンと異なるパッチバージョンがビルドされてもJarを設置できる',
      { timeout: 1000 * 60 },
      async () => {
        const outputPath = serverFolder.child(`${ver19.id}-patched`);
        const readyOperator = new ReadySpigotVersion(ver19, cacheFolder);
        const cachePath = readyOperator.cachePath;
        await outputPath.remove();
        await (await getJarPath(cachePath)).remove();

        // `--rev 1.19`に対して1.19.4がビルドされた場合を再現する
        const execRuntime: ExecRuntime = vi.fn(async (options) => {
          await writeBuiltJar(options, '1.19.4', 'patched jar');
        });

        const res = await readyOperator.completeReady4VersionFiles(
          outputPath,
          execRuntime
        );
        expect(isError(res)).toBe(false);
        expect(await (await getJarPath(outputPath)).readText()).toBe(
          'patched jar'
        );

        // ビルドしたJarがキャッシュされ，別のサーバーの準備では再ビルドしない
        const otherOutputPath = serverFolder.child(`${ver19.id}-patched-2`);
        await otherOutputPath.remove();
        const res2 = await readyOperator.completeReady4VersionFiles(
          otherOutputPath,
          execRuntime
        );
        expect(isError(res2)).toBe(false);
        expect(await (await getJarPath(otherOutputPath)).readText()).toBe(
          'patched jar'
        );
        expect(execRuntime).toHaveBeenCalledTimes(1);
      }
    );
  });
}
