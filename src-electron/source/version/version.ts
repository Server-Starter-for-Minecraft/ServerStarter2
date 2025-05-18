import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { fromRuntimeError, isError } from 'app/src-electron/util/error/error';
import { Runtime } from '../../schema/runtime';
import { AllVersion, Version, VersionType } from '../../schema/version';
import { Path } from '../../util/binary/path';
import { getEulaAgreement, setEulaAgreement } from './eula';
import { getVersionlist, VersionListLoader } from './getVersions/base';
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

/**
 * バージョンを管理するクラス
 */
export class VersionContainer {
  readonly cachePath: Path;
  readonly versionGetters: {
    [key in Exclude<VersionType, 'unknown'>]: VersionListLoader<key>;
  };

  constructor(cachePath: Path) {
    this.cachePath = cachePath;
    this.versionGetters = {
      vanilla: new VanillaVersionLoader(cachePath),
      forge: new ForgeVersionLoader(cachePath),
      spigot: new SpigotVersionLoader(cachePath),
      papermc: new PaperVersionLoader(cachePath),
      mohistmc: new MohistMCVersionLoader(cachePath),
      fabric: new FabricVersionLoader(cachePath),
    } as const;
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listVersions<T extends VersionType>(
    type: T,
    useCache: boolean
  ): Promise<Failable<AllVersion<T>>> {
    if (type === 'unknown')
      return fromRuntimeError(new Error('VERSION_IS_UNKNOWN'));
    const loader = this.versionGetters[type as Exclude<T, 'unknown'>];
    return getVersionlist(useCache, loader);
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
    const readyVersion = getRedeayVersionInstance(version);
    if (isError(readyVersion)) return readyVersion;
    const result = await readyVersion.completeReady4VersionFiles(
      serverPath,
      execRuntime,
      progress
    );

    // Eulaチェック
    progress?.title({ key: 'server.eula.title' });
    const eulaPath = serverPath.child('eula.txt');
    const currentEula = await getEulaAgreement(eulaPath, progress);
    if (!currentEula.eula) {
      const newEula = await eulaAgreementAction(currentEula.url);
      if (isError(newEula)) return newEula;
      const newEulaValue = newEula;
      await setEulaAgreement(eulaPath, newEulaValue, progress);
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
