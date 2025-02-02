import { ServerStartNotification } from 'app/src-electron/schema/server';
import { WorldID } from 'app/src-electron/schema/world';
import { trimAnsi } from 'app/src-electron/util/ansi';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { decoratePromise } from 'app/src-electron/util/promiseDecorator';
import { GroupProgressor } from '../../common/progress';
import { api } from '../../core/api';
import { WorldSettings } from '../world/files/json';
import { WorldLogHandler } from '../world/loghandler';
import { ServerProcess, serverProcess } from './process';
import { readyRunServer } from './ready';

export type RunServer = Promise<Failable<undefined>> & {
  runCommand: (command: string) => Promise<void>;
};

/** サーバーを起動する */
export function runServer(
  cwdPath: Path,
  id: WorldID,
  settings: WorldSettings,
  progress: GroupProgressor,
  notification: ServerStartNotification
): RunServer {
  let process: ServerProcess | undefined = undefined;
  async function promise(): Promise<Failable<undefined>> {
    const readyResult = await readyRunServer(cwdPath, id, settings, progress);
    if (isError(readyResult)) return readyResult;

    const { javaArgs, javaPath } = readyResult;

    // latest.logをアーカイブ化する
    const loghandler = new WorldLogHandler(cwdPath);
    await loghandler.archive();

    const onStart = () => api.send.StartServer(id, notification);
    const onFinish = () => api.send.FinishServer(id);
    const console = (value: string, isError: boolean) => {
      const trimmed = trimAnsi(value);
      // コンソールの内容をGUIに表示
      api.send.AddConsole(id, trimmed, isError);
      loghandler.append(trimmed);
    };

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

    // 一時保管したlogをリセット
    await loghandler.flash();

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
  progress: GroupProgressor,
  notification: ServerStartNotification
) {
  let promise: RunServer;

  let needRun = true;

  const resultPromise = async (): Promise<Failable<undefined>> => {
    while (needRun) {
      needRun = false;
      promise = runServer(cwdPath, id, settings, progress, notification);
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
