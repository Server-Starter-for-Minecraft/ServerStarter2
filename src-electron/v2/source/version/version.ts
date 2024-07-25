import { Runtime } from '../../schema/runtime';
import {
  AllFabricVersion,
  AllForgeVersion,
  AllMohistmcVersion,
  AllPapermcVersion,
  AllSpigotVersion,
  AllVanillaVersion,
  Version,
} from '../../schema/version';
import { err, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { ExecRuntime } from './fileProcess/base';
import { ReadyFabricVersion, RemoveFabricVersion } from './fileProcess/fabric';
import { ReadyForgeVersion, RemoveForgeVersion } from './fileProcess/forge';
import {
  ReadyMohistMCVersion,
  RemoveMohistMCVersion,
} from './fileProcess/mohistmc';
import {
  ReadyPaperMCVersion,
  RemovePaperMCVersion,
} from './fileProcess/papermc';
import { ReadySpigotVersion, RemoveSpigotVersion } from './fileProcess/spigot';
import {
  ReadyVanillaVersion,
  RemoveVanillaVersion,
} from './fileProcess/vanilla';
import { getVersionlist } from './getVersions/base';
import { FabricVersionLoader } from './getVersions/fabric';
import { ForgeVersionLoader } from './getVersions/forge';
import { MohistMCVersionLoader } from './getVersions/mohistmc';
import { PaperVersionLoader } from './getVersions/papermc';
import { SpigotVersionLoader } from './getVersions/spigot';
import { VanillaVersionLoader } from './getVersions/vanilla';

/**
 * バージョンを管理するクラス
 */
export class VersionContainer {
  cachePath: Path;

  // TODO: キャッシュパスを`core`から呼び出さないで，この値を用いる方法に変更
  constructor(cachePath: Path) {
    this.cachePath = cachePath;
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listVanillaVersions(
    useCache: boolean
  ): Promise<Result<AllVanillaVersion>> {
    return getVersionlist(useCache, new VanillaVersionLoader(this.cachePath));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listForgeVersions(useCache: boolean): Promise<Result<AllForgeVersion>> {
    return getVersionlist(useCache, new ForgeVersionLoader(this.cachePath));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listSpigotVersions(
    useCache: boolean
  ): Promise<Result<AllSpigotVersion>> {
    return getVersionlist(useCache, new SpigotVersionLoader(this.cachePath));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listPaperMcVersions(
    useCache: boolean
  ): Promise<Result<AllPapermcVersion>> {
    return getVersionlist(useCache, new PaperVersionLoader(this.cachePath));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listMohistMcVersions(
    useCache: boolean
  ): Promise<Result<AllMohistmcVersion>> {
    return getVersionlist(useCache, new MohistMCVersionLoader(this.cachePath));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listFabricVersions(
    useCache: boolean
  ): Promise<Result<AllFabricVersion>> {
    return getVersionlist(useCache, new FabricVersionLoader(this.cachePath));
  }

  /**
   * サーバーの起動に必要なファイル (version.jar, libraries 等) をパスに用意する
   *
   * jarだけでなくlibrariesとかも一緒にキャッシュしておくとサーバー起動を高速化できそう
   *
   * getCommandはjvm引数を受け取ってjavaの実行時引数を返す
   * ```
   * getCommand({jvmArgs:["--XmX=2G"]})
   * // -> ["--XmX=2G", "-Dlog4j2.formatMsgNoLookups=true", "--jar", "version.jar", "--nogui"]
   * ```
   *
   * @param serverPath サーバーのディレクトリパス jarファイルはここの直下に置く
   * @param execRuntime jarファイルを用意するためのJavaランタイムの実行を提供する
   *
   * @returns 使用するランタイムの種類と, サブプロセスのコマンドを生成する関数 を返す
   */
  async readyVersion(
    version: Version,
    serverPath: Path,
    execRuntime: ExecRuntime
  ): Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { jvmArgs: string[] }) => string[];
    }>
  > {
    switch (version.type) {
      case 'unknown':
        return err(new Error('VERSION_IS_UNKNOWN'));
      case 'vanilla':
        const vanillaFp = new ReadyVanillaVersion(version, this.cachePath);
        return vanillaFp.completeReady4VersionFiles(serverPath, execRuntime);
      case 'spigot':
        const spigotFp = new ReadySpigotVersion(version, this.cachePath);
        return spigotFp.completeReady4VersionFiles(serverPath, execRuntime);
      case 'papermc':
        const papermcFp = new ReadyPaperMCVersion(version, this.cachePath);
        return papermcFp.completeReady4VersionFiles(serverPath, execRuntime);
      case 'forge':
        const forgeFp = new ReadyForgeVersion(version, this.cachePath);
        return forgeFp.completeReady4VersionFiles(serverPath, execRuntime);
      case 'mohistmc':
        const mohistmcFp = new ReadyMohistMCVersion(version, this.cachePath);
        return mohistmcFp.completeReady4VersionFiles(serverPath, execRuntime);
      case 'fabric':
        const fabricFp = new ReadyFabricVersion(version, this.cachePath);
        return fabricFp.completeReady4VersionFiles(serverPath, execRuntime);
    }
  }

  /**
   * 実行時パスからバージョンデータ削除する
   *
   * version.jar / libraries / crash-reports あたりを削除
   * プラグインサーバーだと消すものが増えるかも
   *
   * /plugins /mods は消さないでOK
   *
   * libraries等が生成されていたら消す前にキャッシュに避難しておくと高速化できそう
   */
  async removeVersion(version: Version, path: Path): Promise<Result<void>> {
    switch (version.type) {
      case 'unknown':
        return err(new Error('VERSION_IS_UNKNOWN'));
      case 'vanilla':
        const vanillaFp = new RemoveVanillaVersion(version, this.cachePath);
        return vanillaFp.completeRemoveVersion(path);
      case 'spigot':
        const spigotFp = new RemoveSpigotVersion(version, this.cachePath);
        return spigotFp.completeRemoveVersion(path);
      case 'papermc':
        const papermcFp = new RemovePaperMCVersion(version, this.cachePath);
        return papermcFp.completeRemoveVersion(path);
      case 'forge':
        const forgeFp = new RemoveForgeVersion(version, this.cachePath);
        return forgeFp.completeRemoveVersion(path);
      case 'mohistmc':
        const mohistmcFp = new RemoveMohistMCVersion(version, this.cachePath);
        return mohistmcFp.completeRemoveVersion(path);
      case 'fabric':
        const fabricFp = new RemoveFabricVersion(version, this.cachePath);
        return fabricFp.completeRemoveVersion(path);
    }
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');

  describe('listupVersions', () => {
    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child('getVersions/work');
    workPath.mkdir();

    type TestCase = {
      type: Version['type'];
      loader: any;
      oldestVersion: string;
    };
    const testCases: TestCase[] = [
      {
        type: 'vanilla',
        loader: new VanillaVersionLoader(workPath),
        oldestVersion: '1.3',
      },
      {
        type: 'forge',
        loader: new ForgeVersionLoader(workPath),
        oldestVersion: '1.5.2',
      },
      {
        type: 'papermc',
        loader: new PaperVersionLoader(workPath),
        oldestVersion: '1.8.8',
      },
      {
        type: 'mohistmc',
        loader: new MohistMCVersionLoader(workPath),
        oldestVersion: '1.7.10',
      },
      {
        type: 'fabric',
        loader: new FabricVersionLoader(workPath),
        oldestVersion: '18w43b',
      },
      {
        type: 'spigot',
        loader: new SpigotVersionLoader(workPath),
        oldestVersion: '1.9',
      },
    ];

    test.each(testCases)('versionList ($type)', async (tCase) => {
      // キャッシュの威力を確認するときにはTrueにする
      const useCache = true;
      const getCachedList = await getVersionlist(useCache, tCase.loader);

      // 取得に成功したか
      expect(getCachedList.isOk).toEqual(true);

      // 取得した内容が正しいか（バニラの最も古いバージョンは「1.3」）
      const cachedList = getCachedList.value();
      if ('games' in cachedList) {
        // fabricのみ特別対応
        expect(cachedList.games[cachedList.games.length - 1].id).toEqual(
          tCase.oldestVersion
        );
      } else {
        // その他のサーバー
        expect(cachedList[cachedList.length - 1].id).toEqual(
          tCase.oldestVersion
        );
      }
    });
  });
}
