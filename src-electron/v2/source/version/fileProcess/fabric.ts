import { deepcopy } from 'app/src-electron/util/deepcopy';
import { Runtime } from 'app/src-electron/v2/schema/runtime';
import { FabricVersion, VersionId } from 'app/src-electron/v2/schema/version';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { getRuntimeObj } from './serverJar';
import { getVanillaVersionJson } from './vanilla';
import { VersionJson } from './versionJson';

const fabricJarDownloadURL = (v: FabricVersion) =>
  `https://meta.fabricmc.net/v2/versions/loader/${v.id}/${v.loader}/${v.installer}/server/jar`;

function getServerID(version: FabricVersion) {
  return `${version.id}_${version.loader}_${version.installer}`;
}

export class ReadyFabricVersion extends ReadyVersion<FabricVersion> {
  constructor(version: FabricVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }
  protected async generateVersionJson(): Promise<Result<VersionJson>> {
    // バニラの情報をもとにFabricのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (vanillaVerJson.isErr) return vanillaVerJson;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson.value());
    returnVerJson.download = {
      url: fabricJarDownloadURL(this._version),
    };

    return ok(returnVerJson);
  }
  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime
  ): Promise<Result<void>> {
    const verJson = await verJsonHandler.read();
    if (verJson.isErr) return verJson;

    // Jarをダウンロード
    const downloadJar = await new Url(verJson.value().download.url).into(Bytes);
    if (downloadJar.isErr) return downloadJar;

    // FabricはJarのHashが不明のためチェックを省略
    // Jarをキャッシュ先に書き出して終了
    return await downloadJar.value().into(getJarPath(this.cachePath));
  }
  protected async getRuntime(
    verJsonHandler: JsonSourceHandler<VersionJson>
  ): Promise<Result<Runtime>> {
    const verJson = await verJsonHandler.read();
    if (verJson.isErr) return verJson;

    return getRuntimeObj('minecraft', verJson.value().javaVersion);
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveFabricVersion extends RemoveVersion<FabricVersion> {
  constructor(version: FabricVersion, cacheFolder: Path) {
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
  describe('', async () => {
    const { Path } = await import('src-electron/v2/util/binary/path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child('work');
    workPath.mkdir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver21: FabricVersion = {
      id: '1.21' as VersionId,
      type: 'fabric',
      release: true,
      loader: '0.15.11',
      installer: '1.0.1',
    };

    test('setFabricJar', async () => {
      const outputPath = serverFolder.child('testFabric/ver21');
      const readyOperator = new ReadyFabricVersion(ver21, cacheFolder);
      const cachePath = readyOperator.cachePath;

      // 条件をそろえるために，ファイル類を削除する
      await outputPath.remove();
      // キャッシュの威力を試したいときは以下の行をコメントアウト
      await cachePath?.remove();

      const res = await readyOperator.completeReady4VersionFiles(
        outputPath,
        async (runtime) => ok()
      );

      // 戻り値の検証
      expect(res.isOk).toBe(true);
      expect(res.value().getCommand({ jvmArgs: ['replaceArg'] })[0]).toBe(
        'replaceArg'
      );

      // ファイルの設置状況の検証
      expect(getJarPath(outputPath).exists()).toBe(true);
      // Jarを実行しないと生成されないため，今回はTestの対象外
      // expect(outputPath.child('libraries').exists()).toBe(true);

      // 実行後にファイル削除
      const remover = new RemoveFabricVersion(ver21, cacheFolder);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      expect(getJarPath(outputPath).exists()).toBe(false);
      expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
    });
  });
}
