import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { FabricVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { isError } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { VersionJson } from './utils/versionJson';
import { getVanillaVersionJson } from './vanilla';

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

  protected async generateVersionJson(): Promise<Failable<VersionJson>> {
    // バニラの情報をもとにFabricのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (isError(vanillaVerJson)) return vanillaVerJson;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson);
    returnVerJson.download = {
      url: fabricJarDownloadURL(this._version),
    };

    return returnVerJson;
  }

  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime,
    progress?: GroupProgressor
  ): Promise<Failable<void>> {
    const p = progress?.subtitle({
      key: `server.readyVersion.fabric.readyServerData`,
    });

    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    // Jarをダウンロード
    const downloadJar = await BytesData.fromURL(verJson.download.url);
    if (isError(downloadJar)) return downloadJar;

    // Jarをキャッシュ先に書き出して終了
    p?.delete();
    return getJarPath(this.cachePath).write(downloadJar);
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

  describe('fabric version', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver21: FabricVersion = {
      id: '1.21' as VersionId,
      type: 'fabric',
      release: true,
      loader: '0.15.11',
      installer: '1.0.1',
    };

    test('setFabricJar', { timeout: 1000 * 60 }, async () => {
      const outputPath = serverFolder.child(ver21.id);
      const readyOperator = new ReadyFabricVersion(ver21, cacheFolder);
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
      if (isError(res)) return;

      // 戻り値の検証
      expect(res.getCommand({ jvmArgs: ['replaceArg'] })[0]).toBe('replaceArg');

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
