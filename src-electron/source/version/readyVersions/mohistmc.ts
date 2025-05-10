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
      hash: this._version.jar.md5,
    };
    return returnVerJson;
  }

  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime
  ): Promise<Failable<void>> {
    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    // Jarをダウンロード
    const hash: Hash | undefined = verJson.download.hash
      ? {
          type: 'md5',
          value: verJson.download.hash,
        }
      : undefined;
    // 2024/09/08 時点でmohistから提供されるhashに信用が置けないためコメントアウトしている
    const downloadJar = await BytesData.fromURL(verJson.download.url, hash);
    // const downloadJar = await BytesData.fromURL(verJson.download.url);
    if (isError(downloadJar)) return downloadJar;

    // Jarをキャッシュ先に書き出して終了
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
      id: '1.20.1' as VersionId,
      type: 'mohistmc',
      buildId: '5b34f54e5abee608fa6035b12e9fda85b414e9e0',
      jar: {
        url: 'https://mohistmc.com/api/v2/projects/mohist/1.20.1/builds/5b34f54e5abee608fa6035b12e9fda85b414e9e0/download',
        md5: '8923b0e1bf3ac9eae61ae41714918547',
      },
    };

    test(
      'setMohistJar',
      async () => {
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
        expect(res.getCommand({ jvmArgs: ['replaceArg'] })[0]).toBe(
          'replaceArg'
        );

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
      },
      1000 * 100
    );
  });
}
