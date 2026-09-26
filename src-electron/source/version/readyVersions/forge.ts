import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { Runtime } from 'app/src-electron/schema/runtime';
import { ForgeVersion, VersionId } from 'app/src-electron/schema/version';
import { Path } from 'app/src-electron/util/binary/path';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { isError } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { ExecRuntime, ReadyVersion, RemoveVersion } from './base';
import { getNewForgeArgs } from './utils/forgeArgAnalyzer';
import {
  downloadInstaller,
  getServerJarFromInstaller,
  renameFilesFromInstaller,
} from './utils/forgeInstaller';
import { VersionJson } from './utils/versionJson';
import { getVanillaVersionJson } from './vanilla';

function getServerID(version: ForgeVersion) {
  return `${version.id}_${version.forge_version}`;
}

// ReadyVersionの標準対応以外のキャッシュからコピーすべきファイル群
// 古いForgeは`version.json`とサーバーの実態Jarが分離しているため，これに対応するために正規表現で実態Jarもコピーする
const SUPPORT_SECONDARY_FILES = [
  'version.bat',
  'version.sh',
  /^(?!installer\.jar$).*\.jar$/,
];

export class ReadyForgeVersion extends ReadyVersion<ForgeVersion> {
  constructor(version: ForgeVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder, SUPPORT_SECONDARY_FILES);
  }

  protected async generateVersionJson() {
    // バニラの情報をもとにForgeのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (isError(vanillaVerJson)) return vanillaVerJson;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson);
    returnVerJson.download = { url: this._version.download_url };
    return returnVerJson;
  }

  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime,
    progress?: GroupProgressor
  ): Promise<Failable<void>> {
    const p = progress?.subtitle({
      key: 'server.readyVersion.forge.readyServerData',
    });

    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    // `installer.jar`をダウンロード
    const installerPath = this.cachePath.child('installer.jar');
    const installerRes = await downloadInstaller(
      verJson.download.url,
      installerPath
    );
    if (isError(installerRes)) return installerRes;

    // `installer.jar`を実行
    // installer.jarは常に最新のJavaで実行する
    const runtime: Runtime = {
      type: 'minecraft',
      version: 'java-runtime-delta',
    };
    if (isError(runtime)) return runtime;
    const installerRunRes = await getServerJarFromInstaller(
      'forge',
      installerPath,
      runtime,
      execRuntime,
      progress
    );
    if (isError(installerRunRes)) return installerRunRes;

    // 生成したファイル群をリネーム
    await renameFilesFromInstaller(this.cachePath, this._version);

    // 生成されたファイルを解析して，引数を更新
    const newVerJson = await getNewForgeArgs(
      this.cachePath,
      this._version,
      verJson
    );
    if (isError(newVerJson)) return newVerJson;

    // 引数の更新を反映した`version.json`を書き出して終了
    p?.delete();
    return await verJsonHandler.write(newVerJson);
  }

  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveForgeVersion extends RemoveVersion<ForgeVersion> {
  constructor(version: ForgeVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder, SUPPORT_SECONDARY_FILES);
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('forge version', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver21: ForgeVersion = {
      id: '1.13.2' as VersionId,
      type: 'forge',
      forge_version: '25.0.223',
      download_url:
        'https://maven.minecraftforge.net/net/minecraftforge/forge/1.13.2-25.0.223/forge-1.13.2-25.0.223-installer.jar',
    };

    const JVM_ARGS = ['JVM', 'ARGUMENT'];

    test.each([
      {
        genfiles: [
          {
            path: 'forge-1.21-51.0.22.jar',
            content: 'foo',
          },
        ],
        args: [
          ...JVM_ARGS,
          '-Dfile.encoding=UTF-8',
          '-Dlog4j.configurationFile=log4j2_112-116.xml',
          '-jar',
          expect.any(String),
          '--nogui',
        ],
      },
      {
        genfiles: [
          {
            path: 'version.bat',
            content:
              '# COMMENT\r\n   java @user_jvm_args.txt @path/to/args.txt %*   \r\n',
          },
          {
            path: 'version.sh',
            content:
              'java @user_jvm_args.txt @path/to/args.txt "$@"\n# COMMENT',
          },
          {
            path: 'libraries/to/args.txt',
            content: '-a foo\n--bar buz\n-a.a.a=b',
          },
        ],
        args: [
          ...JVM_ARGS,
          '-Dfile.encoding=UTF-8',
          '-Dlog4j.configurationFile=log4j2_112-116.xml',
          '@path/to/args.txt',
          '--nogui',
        ],
      },
    ])('setForgeJar', { timeout: 1000 * 60 }, async ({ genfiles, args }) => {
      const outputPath = serverFolder.child(ver21.id);
      const readyOperator = new ReadyForgeVersion(ver21, cacheFolder);

      // 条件をそろえるために，ファイル類を削除する
      await outputPath.remove();
      // キャッシュの威力を試したいときは以下の行をコメントアウト
      await readyOperator.cachePath.remove();

      // `installer.jar`の実行によって必要なファイルが生成された体を再現する
      const execRuntime: ExecRuntime = vi.fn(async (options) => {
        for (const { path, content } of genfiles) {
          const tgtJarPath = options.currentDir.child(path);
          await tgtJarPath.writeText(content);
        }
      });

      // テスト対象の関数
      const res = await readyOperator.completeReady4VersionFiles(
        outputPath,
        execRuntime
      );
      expect(isError(res)).toBe(false);
      if (isError(res)) return;

      // 戻り値の検証
      expect(res.getCommand({ jvmArgs: JVM_ARGS })).toEqual(args);

      // ファイルの設置状況の検証
      genfiles.forEach(({ path }) => {
        const targetPath = outputPath.child(path);
        if (targetPath.extname() === '.jar') {
          expect(outputPath.child('version.jar').exists()).toBe(true);
        } else {
          expect(outputPath.child(path).exists()).toBe(true);
        }
      });

      // 実行後にファイル削除
      const remover = new RemoveForgeVersion(ver21, cacheFolder);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      genfiles.forEach(({ path }) => {
        const targetPath = outputPath.child(path);
        if (targetPath.extname() === '.jar') {
          expect(outputPath.child('version.jar').exists()).toBe(false);
        } else {
          expect(readyOperator.cachePath.child(path).exists()).toBe(true);
        }
      });
    });
  });
}
