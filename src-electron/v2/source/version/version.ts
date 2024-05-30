import { Runtime } from '../../schema/runtime';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

/**
 * シングルトンでOK
 */
export class VersionContainer {
  static listVanillaVersions() {}

  static listForgeVersions() {}

  static listSpigotVersions() {}

  static listPaperMcVersions() {}

  static listMohistMcVersions() {}

  static listFabricVersions() {}

  /**
   * バージョンデータをPathに展開する
   *
   * @returns 使用するランタイムの種類と,サブプロセスのコマンドを生成する関数 を返す
   */
  static extractTo(path: Path): Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { runtimePath: Path; jvmArgs: string[] }) => {
        process: string;
        args: string[];
      };
    }>
  >;

  /**
   * バージョンデータをPathから削除する
   *
   * @returns 使用するランタイムの種類と,サブプロセスのコマンドを生成する関数 を返す
   */
  static removeFrom(path: Path): Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { runtimePath: Path; jvmArgs: string[] }) => {
        process: string;
        args: string[];
      };
    }>
  >;
}
