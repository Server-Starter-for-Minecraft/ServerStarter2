import { BrowserWindow, ipcMain } from 'electron';
import { assertComplete } from '../lifecycle/lifecycle';
import { rootLogger } from '../logger/logger';
import { WithError } from '../schema/error';
import { isError } from '../util/error/error';
import { safeExecAsync } from '../util/error/failable';

export const ipcLoggers = () => rootLogger.ipc;

/**
 * API の結果を，結果に応じたレベルでログに残す
 *
 * ログは原則として API の監視で取るため，エラーを見つけやすいよう
 * Failable のエラーは error，WithError の内部エラー（成功扱いだがエラーを含む）は warn で記録する
 *
 * @param logger API の呼び出しごとのロガー
 * @param result API の結果
 */
function logResult(
  logger: ReturnType<ReturnType<typeof ipcLoggers>['handle'][string]>,
  result: unknown
) {
  if (isError(result)) {
    logger.error(result);
    return;
  }
  if (isWithError(result) && result.errors.length > 0) {
    if (isError(result.value)) logger.error(['failed', result]);
    else logger.warn(['success with errors', result]);
    return;
  }
  logger.info(['success', result]);
}

/** WithError の形の値か */
function isWithError(value: unknown): value is WithError<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'errors' in value &&
    Array.isArray(value.errors)
  );
}

export const ipcHandle = <C extends string>(
  channel: C,
  listener: (...args: any[]) => Promise<any>
) =>
  ipcMain.handle(channel, async (_, ...args: any[]) => {
    const logger = ipcLoggers().handle[channel](args);
    logger.info('start');
    // 処理中に例外が発生した場合も，フロントエンドへは Failable のエラーとして返す
    const result = await assertComplete(
      safeExecAsync(async () => listener(...args))
    );
    logResult(logger, result);
    return result;
  });

export const ipcOn = <C extends string>(
  channel: C,
  listener: (...args: any[]) => void
) =>
  ipcMain.on(channel, (_, ...args: any[]) => {
    const logger = ipcLoggers().on[channel](args);
    listener(...args);
    logger.info('success');
  });

export const ipcSend = <C extends string>(
  window: BrowserWindow,
  channel: C,
  ...args: any[]
) => {
  const logger = ipcLoggers().send[channel](args);
  logger.info('success');
  window.webContents.send(channel, ...args);
};

let invokeid = -1;

export async function ipcInvoke<C extends string, T>(
  window: BrowserWindow,
  channel: C,
  ...args: any[]
) {
  return new Promise<T>((resolve) => {
    const logger = ipcLoggers().invoke[channel](args);

    invokeid++;
    const sendId = invokeid.toString();
    const handleChannel = `handle:${channel}`;
    const listener = (
      _: Electron.IpcMainEvent,
      result: any,
      resultId: string
    ) => {
      if (sendId === resultId) {
        ipcMain.removeListener(handleChannel, listener);
        logger.info(['success', result]);
        resolve(result);
      }
    };

    ipcMain.on(handleChannel, listener);

    logger.info('start');
    window.webContents.send(channel, sendId, ...args);
  });
}
