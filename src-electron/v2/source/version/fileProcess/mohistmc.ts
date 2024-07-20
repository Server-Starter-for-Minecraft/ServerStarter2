import { deepcopy } from 'app/src-electron/util/deepcopy';
import { Runtime } from 'app/src-electron/v2/schema/runtime';
import { MohistmcVersion, VersionId } from 'app/src-electron/v2/schema/version';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { checkJarHash, getRuntimeObj } from './serverJar';
import { getVanillaVersionJson } from './vanilla';
import { VersionJson } from './versionJson';

function getServerID(version: MohistmcVersion) {
  return `${version.id}_${version.number}`;
}

export class ReadyMohistMCVersion extends ReadyVersion<MohistmcVersion> {
  constructor(version: MohistmcVersion) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version);
  }
  protected async generateVersionJson(): Promise<Result<VersionJson>> {
    // バニラの情報をもとにMohistのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(this._version.id, true);
    if (vanillaVerJson.isErr) return vanillaVerJson;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson.value());
    returnVerJson.download = {
      url: this._version.jar.url,
      hash: this._version.jar.md5,
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

    // JarのHashを確認
    const correctHash = verJson.value().download.hash;
    if (correctHash) {
      const downloadHash = await checkJarHash(
        downloadJar.value(),
        correctHash,
        'md5'
      );
      if (downloadHash?.isErr) return downloadHash;
    }

    // Jarをキャッシュ先に書き出して終了
    return await downloadJar.value().into(getJarPath(this.cachePath));
  }
  protected async getRuntime(
    verJsonHandler: JsonSourceHandler<VersionJson>
  ): Promise<Result<Runtime>> {
    const verJson = await verJsonHandler.read();
    if (verJson.isErr) return verJson;

    return ok(getRuntimeObj('minecraft', verJson.value().javaVersion));
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveMohistMCVersion extends RemoveVersion<MohistmcVersion> {
  constructor(version: MohistmcVersion) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version);
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { serverSourcePath } = await import('app/src-electron/v2/core/const');

  const ver21: MohistmcVersion = {
    id: '1.20.1' as VersionId,
    type: 'mohistmc',
    number: 748,
    jar: {
      url: 'https://mohistmc.com/api/v2/projects/mohist/1.20.1/builds/748/download',
      md5: 'b25bec54c83c4f94709f5a8fce6ea597',
    },
  };

  test(
    'setMohistJar',
    async () => {
      const outputPath = serverSourcePath.child('testMohist/ver21');
      const readyOperator = new ReadyMohistMCVersion(ver21);
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
      const remover = new RemoveMohistMCVersion(ver21);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      expect(getJarPath(outputPath).exists()).toBe(false);
      expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
    },
    1000 * 100
  );
}
