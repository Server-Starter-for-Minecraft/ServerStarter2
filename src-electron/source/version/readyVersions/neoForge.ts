import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { NeoForgeVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { isError } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { getNewForgeArgs } from './utils/forgeArgAnalyzer';
import {
  downloadInstaller,
  getServerJarFromInstaller,
  renameFilesFromInstaller,
} from './utils/forgeInstaller';
import { VersionJson } from './utils/versionJson';
import { getVanillaVersionJson } from './vanilla';

export const getDownloadUrl = (version: NeoForgeVersion) => {
  const neoVer = version.neoforge_version;
  return `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVer}/neoforge-${neoVer}-installer.jar`;
};

export class ReadyNeoForgeVersion extends ReadyVersion<NeoForgeVersion> {
  constructor(version: NeoForgeVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }

  protected async generateVersionJson(progress?: GroupProgressor) {
    // バニラの情報をもとにNeoForgeのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (isError(vanillaVerJson)) return vanillaVerJson;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson);
    returnVerJson.download = {
      url: getDownloadUrl(this._version),
    };
    return returnVerJson;
  }

  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime,
    progress?: GroupProgressor
  ): Promise<Failable<void>> {
    const p = progress?.subtitle({
      key: 'server.readyVersion.neoforge.readyServerData',
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

    // `installer.jar`用のRuntimeを取得
    const runtime = await this.getRuntime(verJsonHandler);
    if (isError(runtime)) return runtime;

    // `installer.jar`を実行
    const installerRunRes = await getServerJarFromInstaller(
      'neoforge',
      installerPath,
      runtime,
      execRuntime,
      progress
    );
    if (isError(installerRunRes)) return installerRunRes;

    // 生成したファイル群をリネーム
    const renameRes = await renameFilesFromInstaller(
      this.cachePath,
      this._version
    );
    if (isError(renameRes)) return renameRes;

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
    return this._version.neoforge_version;
  }
}

export class RemoveNeoForgeVersion extends RemoveVersion<NeoForgeVersion> {
  constructor(version: NeoForgeVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }
  get serverID(): string {
    return this._version.neoforge_version;
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('neoforge version', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver20: NeoForgeVersion = {
      type: 'neoforge',
      id: '1.20.2' as VersionId,
      neoforge_version: '20.2.86',
    };

    const JVM_ARGS = ['JVM', 'ARGUMENT'];

    const urlCreateReadStreamSpy = vi.spyOn(BytesData, 'fromURL');
    urlCreateReadStreamSpy.mockImplementation(async (url: string) => {
      const dummyAssets = new Path(__dirname).parent().child('test');
      const verManifestURL =
        'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';
      if (url === verManifestURL) {
        return BytesData.fromPath(
          dummyAssets.child('version_manifest_v2.json')
        );
      } else if (url.endsWith('/download') || url.endsWith('-installer.jar')) {
        // `installer.jar`は実際には実行しないため，ダミーのJarを返す
        return BytesData.fromPath(dummyAssets.child('sample.jar'));
      }

      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      return BytesData.fromBuffer(Buffer.from(buffer));
    });

    test('getDownloadUrl', () => {
      expect(getDownloadUrl(ver20)).toBe(
        'https://maven.neoforged.net/releases/net/neoforged/neoforge/20.2.86/neoforge-20.2.86-installer.jar'
      );
    });

    test('serverID', () => {
      expect(new ReadyNeoForgeVersion(ver20, cacheFolder).serverID).toBe(
        '20.2.86'
      );
      expect(new RemoveNeoForgeVersion(ver20, cacheFolder).serverID).toBe(
        '20.2.86'
      );
    });

    test.each([
      {
        // jarが生成されるバージョン
        genfiles: [{ path: 'neoforge-20.2.86-universal.jar', content: 'foo' }],
      },
      {
        // run.bat / run.sh が生成されるバージョン
        genfiles: [
          {
            path: 'run.bat',
            content:
              '# COMMENT\r\n   java @user_jvm_args.txt @path/to/args.txt %*   \r\n',
          },
          {
            path: 'run.sh',
            content:
              'java @user_jvm_args.txt @path/to/args.txt "$@"\n# COMMENT',
          },
        ],
      },
    ])('setNeoForgeJar', { timeout: 1000 * 60 }, async ({ genfiles }) => {
      const outputPath = serverFolder.child(ver20.id);
      const readyOperator = new ReadyNeoForgeVersion(ver20, cacheFolder);

      // 条件をそろえるために，ファイル類を削除する
      await outputPath.remove();
      await readyOperator.cachePath.remove();

      // `installer.jar`の実行によって必要なファイルが生成された体を再現する
      const execRuntime: ExecRuntime = vi.fn(async (options) => {
        for (const { path, content } of genfiles) {
          await options.currentDir.child(path).writeText(content);
        }
      });

      const res = await readyOperator.completeReady4VersionFiles(
        outputPath,
        execRuntime
      );
      expect(isError(res)).toBe(false);
      if (isError(res)) return;

      // `installer.jar`が実行されている
      expect(execRuntime).toHaveBeenCalledTimes(1);

      // 戻り値の検証
      const cmd = res.getCommand({ jvmArgs: JVM_ARGS });
      expect(cmd.slice(0, JVM_ARGS.length)).toEqual(JVM_ARGS);
      if (genfiles.some(({ path }) => path.endsWith('.jar'))) {
        expect(cmd).toContain('-jar');
      } else {
        expect(cmd).toContain('@path/to/args.txt');
      }

      // ファイルの設置状況の検証
      genfiles.forEach(({ path }) => {
        if (path.endsWith('.jar')) {
          expect(getJarPath(outputPath).exists()).toBe(true);
        } else {
          const ext = path.endsWith('.bat') ? '.bat' : '.sh';
          // リネームされた実行ファイルはキャッシュに残る
          expect(readyOperator.cachePath.child(`version${ext}`).exists()).toBe(
            true
          );
        }
      });

      // 実行後にファイル削除
      const remover = new RemoveNeoForgeVersion(ver20, cacheFolder);
      await remover.completeRemoveVersion(outputPath);
      expect(getJarPath(outputPath).exists()).toBe(false);
    });

    test('setNeoForgeJar (installer generates no files)', async () => {
      const outputPath = serverFolder.child(ver20.id);
      const readyOperator = new ReadyNeoForgeVersion(ver20, cacheFolder);
      await outputPath.remove();
      await readyOperator.cachePath.remove();

      // 何も生成されなかった場合は，Jarが見つからずエラーになる
      const res = await readyOperator.completeReady4VersionFiles(
        outputPath,
        async () => {}
      );
      expect(isError(res)).toBe(true);
    });
  });
}
