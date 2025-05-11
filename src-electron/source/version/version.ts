import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { fromRuntimeError, isError } from 'app/src-electron/util/error/error';
import { Runtime } from '../../schema/runtime';
import { AllVersion, Version, VersionType } from '../../schema/version';
import { Path } from '../../util/binary/path';
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
    type: 'unknown',
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
