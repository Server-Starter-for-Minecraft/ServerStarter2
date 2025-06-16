import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { MohistmcVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData, Hash } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { isError } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { VersionJson } from './utils/versionJson';
import { getVanillaVersionJson } from './vanilla';

function getServerID(version: MohistmcVersion) {
  return `${version.id}_${version.buildId}`;
}

export class ReadyMohistMCVersion extends ReadyVersion<MohistmcVersion> {
  constructor(version: MohistmcVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }

  protected async generateVersionJson(): Promise<Failable<VersionJson>> {
    // バニラの情報をもとにMohistのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (isError(vanillaVerJson)) return vanillaVerJson;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson);
    returnVerJson.download = {
      url: this._version.jar.url,
      hash: this._version.jar.sha256,
    };
    return returnVerJson;
  }

  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime,
    progress?: GroupProgressor
  ): Promise<Failable<void>> {
    const p = progress?.subtitle({
      key: 'server.readyVersion.mohistmc.readyServerData',
    });

    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    // Jarをダウンロード
    const hash: Hash | undefined = verJson.download.hash
      ? {
          type: 'sha256',
          value: verJson.download.hash,
        }
      : undefined;
    const downloadJar = await BytesData.fromURL(verJson.download.url, hash);
    if (isError(downloadJar)) return downloadJar;

    // Jarをキャッシュ先に書き出して終了
    p?.delete();
    return getJarPath(this.cachePath).write(downloadJar);
  }

  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveMohistMCVersion extends RemoveVersion<MohistmcVersion> {
  constructor(version: MohistmcVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('mohistmc version', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver20: MohistmcVersion = {
      type: 'mohistmc',
      id: '1.20.1' as VersionId,
      buildId: 157,
      buildName: '2c49e69c7d50fa5ba8210c8648cc8d0f9135fe22',
      jar: {
        url: 'https://api.mohistmc.com/project/mohist/1.20.1/builds/157/download',
        sha256:
          '922f21008d63230033e85565fbff959f2a5158e23021ef4c5343c51d096757d0',
      },
    };

    const urlCreateReadStreamSpy = vi.spyOn(BytesData, 'fromURL');
    urlCreateReadStreamSpy.mockImplementation(async (url: string) => {
      const dummyAssets = new Path(__dirname).parent().child('test');
      const verManifestURL =
        'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';
      if (url === verManifestURL) {
        return BytesData.fromPath(
          dummyAssets.child('version_manifest_v2.json')
        );
      } else if (url.endsWith('/download')) {
        return BytesData.fromPath(dummyAssets.child('sample.jar'));
      }

      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      return BytesData.fromBuffer(Buffer.from(buffer));
    });

    test('setMohistJar', { timeout: 1000 * 60 }, async () => {
      const outputPath = serverFolder.child(ver20.id);
      const readyOperator = new ReadyMohistMCVersion(ver20, cacheFolder);
      const cachePath = readyOperator.cachePath;

      // 条件をそろえるために，ファイル類を削除する
      await outputPath.remove();
      // キャッシュの威力を試したいときは以下の行をコメントアウト
      await cachePath?.remove();

      const res = await readyOperator.completeReady4VersionFiles(
        outputPath,
        async (runtime) => {}
      );
      expect(isError(res)).toBe(false);
      if (isError(res)) return res;

      // 戻り値の検証
      expect(res.getCommand({ jvmArgs: ['replaceArg'] })[0]).toBe('replaceArg');

      // ファイルの設置状況の検証
      expect(getJarPath(outputPath).exists()).toBe(true);
      // Jarを実行しないと生成されないため，今回はTestの対象外
      // expect(outputPath.child('libraries').exists()).toBe(true);

      // 実行後にファイル削除
      const remover = new RemoveMohistMCVersion(ver20, cacheFolder);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      expect(getJarPath(outputPath).exists()).toBe(false);
      expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
    });
  });
}
