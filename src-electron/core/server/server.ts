import { Path } from 'app/src-electron/util/path';
import { readyRunServer } from './ready';
import { WorldID } from 'app/src-electron/schema/world';
import { WorldSettings } from '../world/files/json';
import { api } from '../api';
import { ServerProcess, serverProcess } from './process';
import { Failable } from 'app/src-electron/util/error/failable';
import { decoratePromise } from 'app/src-electron/util/promiseDecorator';
import { isError } from 'app/src-electron/util/error/error';

export type RunServer = Promise<Failable<undefined>> & {
  runCommand: (command: string) => Promise<void>;
};

/** サーバーを起動する */
export function runServer(
  cwdPath: Path,
  id: WorldID,
  settings: WorldSettings
): RunServer {
  let process: ServerProcess | undefined = undefined;
  async function promise() {
    const readyResult = await readyRunServer(
      cwdPath,
      id,
      settings,
      (value: string) => api.send.Progress(id, value)
    );
    if (isError(readyResult)) return readyResult;

    const { javaArgs, javaPath } = readyResult;

    const onStart = () => api.send.StartServer(id);
    const onFinish = () => api.send.FinishServer(id);
    const console = (value: string) => api.send.AddConsole(id, value);

    // サーバーの実行を待機
    process = serverProcess(
      cwdPath,
      id,
      javaPath,
      javaArgs,
      console,
      onStart,
      onFinish
    );
    await process;
    process = undefined;
  }

  async function runCommand(command: string): Promise<void> {
    return process?.runCommand(command);
  }

  const promiseValue = promise();

  return decoratePromise(promiseValue, { runCommand });
}
