import { v2Error } from '../../common/error';
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
import { err, ok, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { getEulaAgreement, setEulaAgreement } from './eula';
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
   * // -> ["--XmX=2G", "-Dlog4j2.formatMsgNoLookups=true", "-jar", "version.jar", "--nogui"]
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
    execRuntime: ExecRuntime,
    eulaAgreementAction: () => Promise<Result<boolean>>
  ): Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { jvmArgs: string[] }) => string[];
    }>
  > {
    const getRedeayVersionInstance = (version: Version) => {
      switch (version.type) {
        case 'unknown':
          return err(new Error('VERSION_IS_UNKNOWN'));
        case 'vanilla':
          return ok(new ReadyVanillaVersion(version, this.cachePath));
        case 'spigot':
          return ok(new ReadySpigotVersion(version, this.cachePath));
        case 'papermc':
          return ok(new ReadyPaperMCVersion(version, this.cachePath));
        case 'forge':
          return ok(new ReadyForgeVersion(version, this.cachePath));
        case 'mohistmc':
          return ok(new ReadyMohistMCVersion(version, this.cachePath));
        case 'fabric':
          return ok(new ReadyFabricVersion(version, this.cachePath));
      }
    };

    // バージョンを用意する
    const readyVersion = await getRedeayVersionInstance(version);
    if (readyVersion.isErr) return readyVersion;
    const result = await readyVersion
      .value()
      .completeReady4VersionFiles(serverPath, execRuntime);

    // Eulaチェック
    const eulaPath = serverPath.child('eula.txt');
    const currentEula = await getEulaAgreement(eulaPath);
    if (currentEula.valueOrDefault(false) === false) {
      const newEula = await eulaAgreementAction();
      if (newEula.isErr) return newEula;
      const newEulaValue = newEula.value();
      await setEulaAgreement(eulaPath, newEulaValue);
      if (newEulaValue === false) return v2Error.disagreeEula.err(undefined);
    }

    return result;
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
  const { test, expect, vi } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');
  const { VanillaVersion } = await import('../../schema/version');

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

  test(
    'eula生成テスト',
    async () => {
      const workPath = new Path(__dirname).child('work', 'version');
      await workPath.remove();
      const container = new VersionContainer(workPath.child('cache'));

      const vanilla = VanillaVersion.parse({
        type: 'vanilla',
        id: '1.12.1',
        release: false,
      });

      const serverPath = workPath.child('server');

      // 1回目 (eula=false)
      {
        const eulaDisagree = vi.fn(async () => ok(false));
        const readyResult = await container.readyVersion(
          vanilla,
          serverPath,
          async () => ok(),
          eulaDisagree
        );
        // eulaの同意を求める関数が実行されるはず
        expect(eulaDisagree).toHaveBeenCalledTimes(1);
        // eula.txtが "eula=false" であるはず
        expect((await serverPath.child('eula.txt').readText()).value()).toBe(
          'eula=false'
        );
        // readyResultが失敗するはず
        expect(readyResult.isErr).toBe(true);

        // 撤収
        await container.removeVersion(vanilla, serverPath);
        expect(await serverPath.child('eula.txt').exists()).toBe(false);
      }

      // 2回目 (eula=true)
      {
        const eulaAgree = vi.fn(async () => ok(true));
        const readyResult = await container.readyVersion(
          vanilla,
          serverPath,
          async () => ok(),
          eulaAgree
        );
        // eulaの同意を求める関数が実行されるはず
        expect(eulaAgree).toHaveBeenCalledTimes(1);
        // eula.txtが "eula=true" であるはず
        expect((await serverPath.child('eula.txt').readText()).value()).toBe(
          'eula=true'
        );
        // readyResultが成功するはず
        expect(readyResult.isOk).toBe(true);

        // 撤収
        await container.removeVersion(vanilla, serverPath);
        expect(await serverPath.child('eula.txt').exists()).toBe(false);
      }

      // 3回目 (eula=true)
      {
        const eulaAgree = vi.fn(async () => ok(true));
        const readyResult = await container.readyVersion(
          vanilla,
          serverPath,
          async () => ok(),
          eulaAgree
        );
        // eulaの同意を求める関数は既に同意済みなので実行されないはず
        expect(eulaAgree).toHaveBeenCalledTimes(0);
        // eula.txtが "eula=true" であるはず
        expect((await serverPath.child('eula.txt').readText()).value()).toBe(
          'eula=true'
        );
        // readyResultが成功するはず
        expect(readyResult.isOk).toBe(true);

        // 撤収
        await container.removeVersion(vanilla, serverPath);
        expect(await serverPath.child('eula.txt').exists()).toBe(false);
      }
    },
    1000 * 60
  );
}
