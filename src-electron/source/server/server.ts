import { runDetached } from 'app/src-public/scripts/promise/runDetached';
import { ServerStartNotification } from 'app/src-electron/schema/server';
import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { ignoreError } from 'app/src-electron/util/error/ignore';
import { decoratePromise } from 'app/src-electron/util/promise/promiseDecorator';
import { GroupProgressor } from '../../common/progress';
import { api } from '../../core/api';
import { sourceLoggers } from '../sourceLogger';
import { WorldSettings } from '../world/files/json';
import { WorldLogHandler } from '../world/loghandler';
import { OnlinePlayersTracker } from './onlinePlayers';
import { ServerProcess, serverProcess } from './process';
import { readyRunServer } from './ready';

const loggers = () => sourceLoggers().server;

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

    // ログから参加中のプレイヤーを読み取り，変化があればGUIに通知
    const onlinePlayers = new OnlinePlayersTracker((players) =>
      api.send.UpdateOnlinePlayers(id, players)
    );

    const onStart = () => api.send.StartServer(id, notification);
    const onFinish = () => {
      onlinePlayers.reset();
      api.send.FinishServer(id);
    };
    const console = (value: string, isError: boolean) => {
      // コンソールの内容をGUIに表示
      // （文字色を表示できるよう、ANSIエスケープシーケンスはフロントエンドで解釈する）
      api.send.AddConsole(id, value, isError);
      // ログには表示を再現できるよう、出力の区切りや標準エラー出力の区別も含めて保存する
      // （書き込みに失敗してもサーバーの実行には影響しないため，失敗はログに残すのみとする）
      runDetached(loghandler.append({ text: value, isError }), (e) =>
        loggers().appendLog().warn(e)
      );
      // オンラインプレイヤーの情報をログから抽出する（出力された順に処理するため同期で行う）
      onlinePlayers.push(value, isError);
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
): RunRebootableServer {
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
    await promise.runCommand('stop');
    const finished = await promise;
    if (isError(finished)) {
      ignoreError(
        finished,
        '再起動のために終了を待つのみ（実行の結果は resultPromise で扱う）'
      );
    }
  };

  const runCommand = async (command: string) => promise?.runCommand(command);

  return decoratePromise(resultPromise(), { reboot, runCommand });
}
