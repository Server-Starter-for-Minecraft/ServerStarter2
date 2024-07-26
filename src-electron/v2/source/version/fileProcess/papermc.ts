import { z } from 'zod';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { Runtime } from 'app/src-electron/v2/schema/runtime';
import { PapermcVersion, VersionId } from 'app/src-electron/v2/schema/version';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Path } from 'app/src-electron/v2/util/binary/path';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { checkJarHash, getRuntimeObj } from './serverJar';
import { getVanillaVersionJson } from './vanilla';
import { VersionJson } from './versionJson';

const paperBuildApiURL = (v: PapermcVersion) =>
  `https://api.papermc.io/v2/projects/paper/versions/${v.id}/builds/${v.build}`;
const paperBuildApiZod = z.object({
  project_id: z.enum(['paper']),
  project_name: z.enum(['Paper']),
  version: z.string(),
  build: z.number(),
  time: z.string(),
  channel: z.string(),
  promoted: z.boolean(),
  downloads: z.object({
    application: z.object({
      name: z.string(),
      sha256: z.string(),
    }),
  }),
});

function getServerID(version: PapermcVersion) {
  return `${version.id}_${version.build}`;
}

export class ReadyPaperMCVersion extends ReadyVersion<PapermcVersion> {
  constructor(version: PapermcVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }
  protected async generateVersionJson() {
    // バニラの情報をもとにPaperのversionJsonを生成
    const vanillaVerJson = await getVanillaVersionJson(
      this._version.id,
      this._cacheFolder,
      true
    );
    if (vanillaVerJson.isErr) return vanillaVerJson;

    // Jarの情報を取得
    const buildURL = paperBuildApiURL(this._version);
    const jsonTxt = (await new Url(buildURL).into(Bytes)).onOk((v) =>
      v.toStr()
    );
    if (jsonTxt.isErr) return jsonTxt;

    // json文字列をパース（エラーの可能性があるためResultでラップ）
    const paperVerInfo = Result.catchSync(() =>
      paperBuildApiZod.parse(JSON.parse(jsonTxt.value()))
    );
    if (paperVerInfo.isErr) return paperVerInfo;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson.value());
    const { name, sha256 } = paperVerInfo.value().downloads.application;
    returnVerJson.download = {
      url: `${buildURL}/downloads/${name}`,
      hash: sha256,
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
        'sha256'
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

export class RemovePaperMCVersion extends RemoveVersion<PapermcVersion> {
  constructor(version: PapermcVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child('work');
  workPath.mkdir();

  const cacheFolder = workPath.child('cache');
  const serverFolder = workPath.child('servers');

  const ver21: PapermcVersion = {
    id: '1.21' as VersionId,
    type: 'papermc',
    build: 40,
  };

  test(
    'setPaperJar',
    async () => {
      const outputPath = serverFolder.child('testPaper/ver21');
      const readyOperator = new ReadyPaperMCVersion(ver21, cacheFolder);
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
      const remover = new RemovePaperMCVersion(ver21, cacheFolder);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      expect(getJarPath(outputPath).exists()).toBe(false);
      expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
    },
    1000 * 100
  );
}
