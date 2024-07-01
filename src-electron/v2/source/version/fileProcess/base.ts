import { Runtime } from '../../../schema/runtime';
import { Result } from '../../../util/base';
import { Path } from '../../../util/binary/path';

/**
 * サーバーの本体ファイルであるJarの設置と削除を担当する
 */
export interface ServerVersionFileProcess {
  setVersionFile: (
    path: Path,
    readyRuntime: (runtime: Runtime) => Promise<Result<void>>
  ) => Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { jvmArgs: string[] }) => string[];
    }>
  >;
  removeVersionFile: (path: Path) => Promise<Result<void>>;
}
