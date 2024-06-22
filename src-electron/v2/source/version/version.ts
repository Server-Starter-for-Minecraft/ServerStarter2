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
  /** @param fromCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listVanillaVersions(
    fromCache: boolean
  ): Promise<Result<AllVanillaVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param fromCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listForgeVersions(
    fromCache: boolean
  ): Promise<Result<AllForgeVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param fromCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listSpigotVersions(
    fromCache: boolean
  ): Promise<Result<AllSpigotVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param fromCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listPaperMcVersions(
    fromCache: boolean
  ): Promise<Result<AllPapermcVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param fromCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listMohistMcVersions(
    fromCache: boolean
  ): Promise<Result<AllMohistmcVersion>> {
    return err(new Error('not_implemanted'));
  }

  /** @param fromCache trueの時はキャッシュから内容を読み取る / falseの時はURLからフェッチしてキャッシュを更新 */
  async listFabricVersions(
    fromCache: boolean
  ): Promise<Result<AllFabricVersion>> {
    return err(new Error('not_implemanted'));
  }

  /**
   * サーバー実行ディレクトリ構成をPathに展開する
   *
   * jarだけでなくlibrariesとかも一緒に移動できるとサーバー起動を高速化できそう
   *
   * @returns 使用するランタイムの種類と,サブプロセスのコマンドを生成する関数 を返す
   */
  async extractTo(
    versionIdntity: Version,
    path: Path
  ): Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { runtimePath: Path; jvmArgs: string[] }) => {
        process: string;
        args: string[];
      };
    }>
  > {
    return err(new Error('not_implemanted'));
  }

  /**
   * バージョンデータをPathごと削除する
   *
   * libraries等が生成されていたらキャッシュに避難すると高速化できそう
   */
  async removeFrom(versionIdntity: Version, path: Path): Promise<Result<void>> {
    return err(new Error('not_implemanted'));
  }
}
