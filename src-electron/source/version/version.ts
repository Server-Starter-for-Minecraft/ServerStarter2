import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { fromRuntimeError, isError } from 'app/src-electron/util/error/error';
import { Runtime } from '../../schema/runtime';
import { AllVersion, Version, VersionType } from '../../schema/version';
import { Path } from '../../util/binary/path';
import { sourceLoggers } from '../sourceLogger';
import { getEulaAgreement, setEulaAgreement } from './eula';
import { getVersionlist } from './getVersions/base';
import { FabricVersionLoader } from './getVersions/fabric';
import { ForgeVersionLoader } from './getVersions/forge';
import { MohistMCVersionLoader } from './getVersions/mohistmc';
import { PaperVersionLoader } from './getVersions/papermc';
import { SpigotVersionLoader } from './getVersions/spigot';
import { VanillaVersionLoader } from './getVersions/vanilla';
import { ExecRuntime } from './readyVersions/base';
import {
  ReadyFabricVersion,
  RemoveFabricVersion,
} from './readyVersions/fabric';
import { ReadyForgeVersion, RemoveForgeVersion } from './readyVersions/forge';
import {
  ReadyMohistMCVersion,
  RemoveMohistMCVersion,
} from './readyVersions/mohistmc';
import {
  ReadyPaperMCVersion,
  RemovePaperMCVersion,
} from './readyVersions/papermc';
import {
  ReadySpigotVersion,
  RemoveSpigotVersion,
} from './readyVersions/spigot';
import {
  ReadyVanillaVersion,
  RemoveVanillaVersion,
} from './readyVersions/vanilla';

export const versionLogger = () => sourceLoggers().version;

/**
 * バージョンを管理するクラス
 */
export class VersionContainer {
  cachePath: Path;

  constructor(cachePath: Path) {
    this.cachePath = cachePath;
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listVersions(
    type: 'vanilla',
    useCache: boolean
  ): Promise<Failable<AllVersion<'vanilla'>>>;
  async listVersions(
    type: 'forge',
    useCache: boolean
  ): Promise<Failable<AllVersion<'forge'>>>;
  async listVersions(
    type: 'spigot',
    useCache: boolean
  ): Promise<Failable<AllVersion<'spigot'>>>;
  async listVersions(
    type: 'papermc',
    useCache: boolean
  ): Promise<Failable<AllVersion<'papermc'>>>;
  async listVersions(
    type: 'mohistmc',
    useCache: boolean
  ): Promise<Failable<AllVersion<'mohistmc'>>>;
  async listVersions(
    type: 'fabric',
    useCache: boolean
  ): Promise<Failable<AllVersion<'fabric'>>>;
  async listVersions(
    type: 'undefined',
    useCache: boolean
  ): Promise<Failable<never>>;
  async listVersions<T extends VersionType>(type: T, useCache: boolean) {
    switch (type) {
      case 'vanilla':
        return getVersionlist<'vanilla'>(
          useCache,
          new VanillaVersionLoader(this.cachePath)
        );
      case 'forge':
        return getVersionlist<'forge'>(
          useCache,
          new ForgeVersionLoader(this.cachePath)
        );
      case 'spigot':
        return getVersionlist<'spigot'>(
          useCache,
          new SpigotVersionLoader(this.cachePath)
        );
      case 'papermc':
        return getVersionlist<'papermc'>(
          useCache,
          new PaperVersionLoader(this.cachePath)
        );
      case 'mohistmc':
        return getVersionlist<'mohistmc'>(
          useCache,
          new MohistMCVersionLoader(this.cachePath)
        );
      case 'fabric':
        return getVersionlist<'fabric'>(
          useCache,
          new FabricVersionLoader(this.cachePath)
        );
      case 'unknown':
        return;
    }
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
    eulaAgreementAction: (url: string) => Promise<Failable<boolean>>,
    progress?: GroupProgressor
  ): Promise<
    Failable<{
      runtime: Runtime;
      getCommand: (option: { jvmArgs: string[] }) => string[];
    }>
  > {
    // TODO: progress対応
    const getRedeayVersionInstance = (version: Version) => {
      switch (version.type) {
        case 'unknown':
          return fromRuntimeError(new Error('VERSION_IS_UNKNOWN'));
        case 'vanilla':
          return new ReadyVanillaVersion(version, this.cachePath);
        case 'spigot':
          return new ReadySpigotVersion(version, this.cachePath);
        case 'papermc':
          return new ReadyPaperMCVersion(version, this.cachePath);
        case 'forge':
          return new ReadyForgeVersion(version, this.cachePath);
        case 'mohistmc':
          return new ReadyMohistMCVersion(version, this.cachePath);
        case 'fabric':
          return new ReadyFabricVersion(version, this.cachePath);
      }
    };

    // バージョンを用意する
    const readyVersion = await getRedeayVersionInstance(version);
    if (isError(readyVersion)) return readyVersion;
    const result = await readyVersion.completeReady4VersionFiles(
      serverPath,
      execRuntime
    );

    // Eulaチェック
    const eulaPath = serverPath.child('eula.txt');
    const currentEula = await getEulaAgreement(eulaPath);
    if (isError(currentEula)) return currentEula;

    if (!currentEula.eula) {
      const newEula = await eulaAgreementAction(currentEula.url);
      if (isError(newEula)) return newEula;
      const newEulaValue = newEula;
      await setEulaAgreement(eulaPath, newEulaValue);
      if (newEulaValue === false)
        return errorMessage.core.minecraftEULANotAccepted();
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
  async removeVersion(version: Version, path: Path): Promise<Failable<void>> {
    switch (version.type) {
      case 'unknown':
        return fromRuntimeError(new Error('VERSION_IS_UNKNOWN'));
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
  const { describe, test, expect, vi } = import.meta.vitest;

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
      expect(isError(getCachedList)).toEqual(false);
      if (isError(getCachedList)) return;

      // 取得した内容が正しいか（バニラの最も古いバージョンは「1.3」）
      const cachedList = getCachedList;
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
      const { VanillaVersion } = await import('../../schema/version');

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
        const eulaDisagree = vi.fn(async () => false);
        const readyResult = await container.readyVersion(
          vanilla,
          serverPath,
          async () => {},
          eulaDisagree
        );
        // eulaの同意を求める関数が実行されるはず
        expect(eulaDisagree).toHaveBeenCalledTimes(1);
        // eula.txtが "eula=false" であるはず
        expect(await serverPath.child('eula.txt').readText()).toBe(
          'eula=false'
        );
        // readyResultが失敗するはず
        expect(isError(readyResult)).toBe(true);

        // 撤収
        await container.removeVersion(vanilla, serverPath);
        expect(serverPath.child('eula.txt').exists()).toBe(false);
      }

      // 2回目 (eula=true)
      {
        const eulaAgree = vi.fn(async () => true);
        const readyResult = await container.readyVersion(
          vanilla,
          serverPath,
          async () => {},
          eulaAgree
        );
        // eulaの同意を求める関数が実行されるはず
        expect(eulaAgree).toHaveBeenCalledTimes(1);
        // eula.txtが "eula=true" であるはず
        expect(await serverPath.child('eula.txt').readText()).toBe('eula=true');
        // readyResultが成功するはず
        expect(isError(readyResult)).toBe(false);

        // 撤収
        await container.removeVersion(vanilla, serverPath);
        expect(serverPath.child('eula.txt').exists()).toBe(false);
      }

      // 3回目 (eula=true)
      {
        const eulaAgree = vi.fn(async () => true);
        const readyResult = await container.readyVersion(
          vanilla,
          serverPath,
          async () => {},
          eulaAgree
        );
        // eulaの同意を求める関数は既に同意済みなので実行されないはず
        expect(eulaAgree).toHaveBeenCalledTimes(0);
        // eula.txtが "eula=true" であるはず
        expect(await serverPath.child('eula.txt').readText()).toBe('eula=true');
        // readyResultが成功するはず
        expect(isError(readyResult)).toBe(true);

        // 撤収
        await container.removeVersion(vanilla, serverPath);
        expect(serverPath.child('eula.txt').exists()).toBe(false);
      }
    },
    1000 * 60
  );
}
