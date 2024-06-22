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
    return err(new Error('not_implemanted'));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listForgeVersions(useCache: boolean): Promise<Result<AllForgeVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listSpigotVersions(
    useCache: boolean
  ): Promise<Result<AllSpigotVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listPaperMcVersions(
    useCache: boolean
  ): Promise<Result<AllPapermcVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listMohistMcVersions(
    useCache: boolean
  ): Promise<Result<AllMohistmcVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param useCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listFabricVersions(
    useCache: boolean
  ): Promise<Result<AllFabricVersion>> {
    return err(new Error('not_implemanted'));
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
   * @param path サーバーのディレクトリパス jarファイルはここの直下に置く
   * @param readyRuntime jarファイルを用意する際にランタイムが必要なことがあるので、指定したランタイムを用意する
   *
   * @returns 使用するランタイムの種類と, サブプロセスのコマンドを生成する関数 を返す
   */
  async readyVersion(
    version: Version,
    path: Path,
    readyRuntime: (runtime: Runtime) => Promise<Result<void>>
  ): Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { jvmArgs: string[] }) => string[];
    }>
  > {
    // TODO: @CivilTT spigotの導入時に今はひどい条件分岐でMinecraftRuntimeを使用しているので、UniversalRuntimeを返すとよい
    return err(new Error('not_implemanted'));
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
  async removeVersion(
    versionIdntity: Version,
    path: Path
  ): Promise<Result<void>> {
    return err(new Error('not_implemanted'));
  }
}
