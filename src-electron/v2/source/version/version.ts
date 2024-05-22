import { Runtime } from '../../schema/runtime';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

/**
 * シングルトンでOK
 */
export class VersionContainer {
  /**
   * TODO: バージョンの全列挙はあほなので何か策が必要
   */
  static list() {}

  /**
   * バージョンデータをPathに展開する
   *
   * @returns 使用するランタイムの種類と,サブプロセスのコマンドを生成する関数 を変えす
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
}
