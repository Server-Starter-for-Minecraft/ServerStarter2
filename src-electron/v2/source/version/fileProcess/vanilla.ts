import { z } from 'zod';
import { serverSourcePath } from 'app/src-electron/v2/core/const';
import {
  minecraftRuntimeVersions,
  Runtime,
} from 'app/src-electron/v2/schema/runtime';
import { VanillaVersion, VersionId } from 'app/src-electron/v2/schema/version';
import { err, ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { getJarPath, ReadyVersion, RemoveVersion } from '../fileProcess/base';
import { getVersionMainfest } from '../getVersions/mainfest';
import { checkJarHash, getRuntimeObj } from './serverJar';
import { getVersionJsonObj, VersionJson } from './versionJson';

/**
 * manifestのURLから取得される各バージョンのJSON情報を`version.json`の内容に変換
 */
function vanillaMetaInfo2VersionJson(
  metaObj: Record<string, any>
): VersionJson {
  // 取得したJSONのパース用型定義
  const metaInfoZod = z.object({
    downloads: z.object({
      server: z.object({
        sha1: z.string(),
        size: z.number(),
        url: z.string(),
      }),
    }),
    javaVersion: z
      .object({
        component: z.enum(minecraftRuntimeVersions),
        majorVersion: z.number(),
      })
      .optional(),
  });

  return metaInfoZod
    .transform((obj) =>
      getVersionJsonObj(
        obj.downloads.server.url,
        obj.downloads.server.sha1,
        obj.javaVersion
      )
    )
    .parse(metaObj);
}

function getServerID(version: VanillaVersion) {
  return version.id;
}

export class ReadyVanillaVersion extends ReadyVersion<VanillaVersion> {
  constructor(version: VanillaVersion) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version);
  }
  protected generateVersionJson() {
    // `version.json`に書き込めるオブジェクトを生成
    return getVanillaVersionJson(this._version.id);
  }
  protected async generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    readyRuntime: (runtime: Runtime) => Promise<Result<void>>
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
        'sha1'
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

    return ok(
      getRuntimeObj('minecraft', verJson.value().javaVersion?.component)
    );
  }
  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveVanillaVersion extends RemoveVersion<VanillaVersion> {
  get serverID(): string {
    return getServerID(this._version);
  }
}

/**
 * バニラ版の`version.json`のオブジェクトを生成
 *
 * バニラの`version.json`をもとにほかのサーバーの`version.json`を作成するため，`export`している
 */
export async function getVanillaVersionJson(
  versionID: VersionId
): Promise<Result<VersionJson>> {
  // バージョン情報の大元は`version_manifest_v2.json`から取得する
  const manifest = await getVersionMainfest();
  if (manifest.isErr) {
    return manifest;
  }

  // 当該バージョンに関するManifestを取得
  const verManifest = manifest.value().versions.find((v) => versionID === v.id);
  if (!verManifest) {
    return err(new Error('NOT_FOUND_VERSION_IN_MANIFEST'));
  }

  // manifestのURLから取得される各バージョンのJSON情報
  const jsonStr = (await new Url(verManifest.url).into(Bytes)).onOk((val) =>
    val.toStr()
  );
  if (jsonStr.isErr) {
    return jsonStr;
  }

  // JSON情報を変換して`version.json`に書き込めるオブジェクトを生成
  const verJson = vanillaMetaInfo2VersionJson(JSON.parse(jsonStr.value()));

  return ok(verJson);
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  const ver21: VanillaVersion = {
    id: '1.21' as VersionId,
    type: 'vanilla',
    release: true,
  };

  test('metaJsonParser', async () => {
    const urlFromManifest =
      'https://piston-meta.mojang.com/v1/packages/177e49d3233cb6eac42f0495c0a48e719870c2ae/1.21.json';

    const jsonStr = (await new Url(urlFromManifest).into(Bytes)).onOk((val) =>
      val.toStr()
    );
    if (jsonStr.isErr) {
      return jsonStr;
    }

    // JSON情報を変換して`version.json`に書き込めるオブジェクトを生成
    const verJson = vanillaMetaInfo2VersionJson(JSON.parse(jsonStr.value()));

    expect(verJson.javaVersion?.component).toEqual('java-runtime-delta');
  });

  test('setVersionJar', async () => {
    const outputPath = serverSourcePath.child('test/ver21');
    const readyOperator = new ReadyVanillaVersion(ver21);
    const cachePath = readyOperator.cachePath;

    // 条件をそろえるために，ファイル類を削除する
    await outputPath.remove();
    // キャッシュの威力を試したいときは以下の行をコメントアウト
    // await cachePath?.remove();

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
    const remover = new RemoveVanillaVersion(ver21);
    await remover.completeRemoveVersion(outputPath);

    // 削除後の状態を確認
    expect(getJarPath(outputPath).exists()).toBe(false);
    expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
  });
}
