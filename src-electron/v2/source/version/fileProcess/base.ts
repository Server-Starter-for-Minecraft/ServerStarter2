import { Runtime } from '../../../schema/runtime';
import { Result } from '../../../util/base';
import { Path } from '../../../util/binary/path';

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
