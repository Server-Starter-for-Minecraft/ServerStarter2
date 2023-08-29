import { Path } from 'app/src-electron/util/path';
import { readyRunServer } from './ready';
import { WorldID } from 'app/src-electron/schema/world';
import { WorldSettings } from '../world/files/json';
import { api } from '../api';
import { ServerProcess, serverProcess } from './process';
import { Failable } from 'app/src-electron/util/error/failable';
import { decoratePromise } from 'app/src-electron/util/promiseDecorator';
import { isError } from 'app/src-electron/util/error/error';
import { GroupProgressor } from '../progress/progress';
import { trimAnsi } from 'app/src-electron/util/ansi';

export type RunServer = Promise<Failable<undefined>> & {
  runCommand: (command: string) => Promise<void>;
};

/** サーバーを起動する */
export function runServer(
  cwdPath: Path,
  id: WorldID,
  settings: WorldSettings,
  progress: GroupProgressor
): RunServer {
  let process: ServerProcess | undefined = undefined;
  async function promise(): Promise<Failable<undefined>> {
    const readyResult = await readyRunServer(cwdPath, id, settings, progress);
    if (isError(readyResult)) return readyResult;

    const { javaArgs, javaPath } = readyResult;

    const onStart = () => api.send.StartServer(id);
    const onFinish = () => api.send.FinishServer(id);
    const console = (value: string, isError: boolean) =>
      api.send.AddConsole(id, trimAnsi(value), isError);

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
    const runresult = await process;
    process = undefined;
    return runresult;
  }

  async function runCommand(command: string): Promise<void> {
    return process?.runCommand(command);
  }

  const promiseValue = promise();

  return decoratePromise(promiseValue, { runCommand });
}

export type RunRebootableServer = Promise<Failable<undefined>> & {
  runCommand: (command: string) => Promise<void>;
  reboot: () => Promise<void>;
};

/** サーバーを起動する */
export function runRebootableServer(
  cwdPath: Path,
  id: WorldID,
  settings: WorldSettings,
  progress: GroupProgressor
) {
  let promise: RunServer;

  let needRun = true;

  const resultPromise = async (): Promise<Failable<undefined>> => {
    while (needRun) {
      needRun = false;
      promise = runServer(cwdPath, id, settings, progress);
      const promiseValue = await promise;
      if (isError(promiseValue)) return promiseValue;
    }
  };

  const reboot = async () => {
    needRun = true;
    promise.runCommand('stop');
    await promise;
  };

  const runCommand = (command: string) => promise?.runCommand(command);

  return decoratePromise(resultPromise(), { reboot, runCommand });
}
