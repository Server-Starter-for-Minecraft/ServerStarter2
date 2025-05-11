import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { Runtime } from 'app/src-electron/schema/runtime';
import { PapermcVersion, VersionId } from 'app/src-electron/schema/version';
import { BytesData, Hash } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { isError } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { ExecRuntime, getJarPath, ReadyVersion, RemoveVersion } from './base';
import { VersionJson } from './utils/versionJson';
import { getVanillaVersionJson } from './vanilla';

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
    if (isError(vanillaVerJson)) return vanillaVerJson;

    // Jarの情報を取得
    const buildURL = paperBuildApiURL(this._version);
    const jsonBytes = await BytesData.fromURL(buildURL);
    if (isError(jsonBytes)) return jsonBytes;

    const paperVerInfo = await jsonBytes.json(paperBuildApiZod);
    if (isError(paperVerInfo)) return paperVerInfo;

    // ダウンロードURLを更新
    const returnVerJson = deepcopy(vanillaVerJson);
    const { name, sha256 } = paperVerInfo.downloads.application;
    returnVerJson.download = {
      url: `${buildURL}/downloads/${name}`,
      hash: sha256,
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
          type: 'sha256',
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
  const { describe, test, expect } = import.meta.vitest;

  describe('papermc version', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    const cacheFolder = workPath.child('cache');
    const serverFolder = workPath.child('servers');

    const ver21: PapermcVersion = {
      id: VersionId.parse('1.21'),
      type: 'papermc',
      build: 40,
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

    test('setPaperJar', { timeout: 1000 * 60 }, async () => {
      const outputPath = serverFolder.child(ver21.id);
      const readyOperator = new ReadyPaperMCVersion(ver21, cacheFolder);
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
      const remover = new RemovePaperMCVersion(ver21, cacheFolder);
      await remover.completeRemoveVersion(outputPath);

      // 削除後の状態を確認
      expect(getJarPath(outputPath).exists()).toBe(false);
      expect(cachePath && getJarPath(cachePath).exists()).toBe(true);
    });
  });
}
