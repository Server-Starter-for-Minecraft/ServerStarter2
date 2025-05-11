import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { VanillaVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData, Hash } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { getVersionMainfest } from '../getVersions/manifest';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { getVersionJsonObj, VersionJson } from './utils/versionJson';

/** VersionManifestから取得したJSONのパース用型定義 */
const MetaInfoZod = z.object({
  downloads: z.object({
    server: z.object({
      sha1: z.string(),
      size: z.number(),
      url: z.string(),
    }),
  }),
  javaVersion: z
    .object({
      component: z.string(),
      majorVersion: z.number(),
    })
    .optional(),
});
const VersionJsonConverted = MetaInfoZod.transform((obj) =>
  getVersionJsonObj(
    obj.downloads.server.url,
    true,
    obj.downloads.server.sha1,
    obj.javaVersion
  )
);

function getServerID(version: VanillaVersion) {
  return version.id;
}

export class ReadyVanillaVersion extends ReadyVersion<VanillaVersion> {
  constructor(version: VanillaVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }

  protected generateVersionJson() {
    // `version.json`に書き込めるオブジェクトを生成
    return getVanillaVersionJson(this._version.id, this._cacheFolder, false);
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
          type: 'sha1',
          value: verJson.download.hash,
        }
      : undefined;
    const downloadJar = await BytesData.fromURL(verJson.download.url, hash);
    if (isError(downloadJar)) return downloadJar;

    // Jarをキャッシュ先に書き出して終了
    return getJarPath(this.cachePath).write(downloadJar);
  }

  get serverID(): string {
    return getServerID(this._version);
  }
}

export class RemoveVanillaVersion extends RemoveVersion<VanillaVersion> {
  constructor(version: VanillaVersion, cacheFolder: Path) {
    // キャッシュから本番環境へコピーするファイルを追加
    super(version, cacheFolder);
  }
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
  versionID: VersionId,
  cacheFolder: Path,
  useCache: boolean
): Promise<Failable<VersionJson>> {
  // バージョン情報の大元は`version_manifest_v2.json`から取得する
  const manifest = await getVersionMainfest(cacheFolder, useCache);
  if (isError(manifest)) return manifest;

  // 当該バージョンに関するManifestを取得
  const verManifest = manifest.versions.find((v) => versionID === v.id);
  if (!verManifest)
    return errorMessage.core.version.vanillaVersionNotExists({
      version: versionID,
    });

  // manifestのURLから取得される各バージョンのJSON情報
  const jsonBytes = await BytesData.fromURL(verManifest.url);
  if (isError(jsonBytes)) return jsonBytes;

  // `version.json`に書き込む形式に変換したJsonを返す
  return jsonBytes.json(VersionJsonConverted);
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('vanilla version', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver21: VanillaVersion = {
      id: VersionId.parse('1.21'),
      type: 'vanilla',
      release: true,
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
      } else if (url.endsWith('.xml')) {
        return BytesData.fromPath(dummyAssets.child('sample.xml'));
      } else if (url.endsWith('.jar')) {
        return BytesData.fromPath(dummyAssets.child('sample.jar'));
      }

      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      return BytesData.fromBuffer(Buffer.from(buffer));
    });

    test('metaJsonParser', async () => {
      const res = await getVanillaVersionJson(
        VersionId.parse('1.21'),
        cacheFolder,
        false
      );
      expect(isError(res)).toBeFalsy();
      if (isError(res)) return res;

      expect(res.javaVersion?.component).toEqual('java-runtime-delta');
    });

    test('setVersionJar', { timeout: 1000 * 60 }, async () => {
      const outputPath = serverFolder.child(ver21.id);
      const readyOperator = new ReadyVanillaVersion(ver21, cacheFolder);
      const cachePath = readyOperator.cachePath;

      // 条件をそろえるために，ファイル類を削除する
      await outputPath.remove();
      // キャッシュの威力を試したいときは以下の行をコメントアウト
      // await cachePath?.remove();

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
      const remover = new RemoveVanillaVersion(ver21, cacheFolder);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      expect(getJarPath(outputPath).exists()).toBe(false);
      expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
    });

    // Log4Jのファイルが`outputPath`にコピーされていることを確認する（各Log4Jのバージョンで確認）
    // 上記に関連して，各バージョンのgetCommand()が正しいArgsを返すことを確認する
    const log4JCaseVers: {
      ver: VersionId;
      log4JFile?: string;
      command?: string;
    }[] = [
      {
        ver: VersionId.parse('1.21'),
      },
      {
        ver: VersionId.parse('1.17'),
        command: '-Dlog4j2.formatMsgNoLookups=true',
      },
      {
        ver: VersionId.parse('1.16'),
        command: '-Dlog4j.configurationFile=log4j2_112-116.xml',
        log4JFile: 'log4j2_112-116.xml',
      },
      {
        ver: VersionId.parse('1.9'),
        command: '-Dlog4j.configurationFile=log4j2_17-111.xml',
        log4JFile: 'log4j2_17-111.xml',
      },
      {
        ver: VersionId.parse('1.5'),
      },
    ];
    test.each(log4JCaseVers)(
      'log4Jcheck ($ver)',
      async ({ ver, command, log4JFile }) => {
        const outputPath = serverFolder.child(`log4Jtest/ver${ver}`);
        const readyOperator = new ReadyVanillaVersion(
          {
            type: 'vanilla',
            id: ver,
            release: true,
          },
          cacheFolder
        );

        // 条件をそろえるために，ファイル類を削除する
        await outputPath.remove();
        // キャッシュの威力を試したいときは以下の行をコメントアウト
        // await readyOperator.cachePath.remove();

        const res = await readyOperator.completeReady4VersionFiles(
          outputPath,
          async (runtime) => {}
        );
        expect(isError(res)).toBe(false);
        if (isError(res)) return;

        // 戻り値の検証
        if (command) {
          expect(
            res.getCommand({ jvmArgs: ['replaceArg'] }).includes(command)
          ).toBe(true);
        }

        // ファイルの存在確認
        if (log4JFile) {
          expect(outputPath.child(log4JFile).exists()).toBe(true);
        }
      },
      1000 * 100
    );
  });
}
