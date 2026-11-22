import { BrowserWindow, ipcMain } from 'electron';
import { fromIPC } from '../api/boundary';
import { AnyFunc } from '../api/types';
import { assertComplete } from '../lifecycle/lifecycle';
import { rootLogger } from '../logger/logger';
import { Failable, WithError } from '../schema/error';
import { fromRuntimeError, isError } from '../util/error/error';

export const ipcLoggers = () => rootLogger.ipc;

/** API の結果を記録するロガー（API の呼び出しごとのロガーのうち，結果の記録に使う部分） */
type ResultLogger = Pick<
  ReturnType<ReturnType<typeof ipcLoggers>['handle'][string]>,
  'error' | 'warn' | 'info'
>;

/**
 * API の結果を，結果に応じたレベルでログに残す
 *
 * ログは原則として API の監視で取るため，エラーを見つけやすいよう次のレベルで記録する
 * - 失敗（Failable のエラー，または value がエラーの WithError）：error
 *   （`withError(エラー)` のように errors が空の失敗も含む）
 * - 成功したが内部エラーを含む（value が成功で errors がある WithError）：warn
 * - それ以外の成功：info
 *
 * @param logger API の呼び出しごとのロガー
 * @param result API の結果
 */
export function logResult(logger: ResultLogger, result: unknown) {
  if (isError(result)) {
    logger.error(['failed', result]);
    return;
  }
  if (isWithError(result)) {
    if (isError(result.value)) {
      logger.error(['failed', result]);
      return;
    }
    if (result.errors.length > 0) {
      logger.warn(['success with errors', result]);
      return;
    }
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
  listener: AnyFunc<Promise<unknown>>
) =>
  ipcMain.handle(channel, async (_, ...args: unknown[]) => {
    const logger = ipcLoggers().handle[channel](args);
    logger.info('start');
    // 処理中に予期しない例外が発生した場合は，ログに残したうえで従来どおり reject としてフロントエンドへ伝える
    // （API の戻り値の型が Failable でないものもあるため，例外を Failable の値として返すことはしない）
    try {
      const result = await assertComplete(listener(...fromIPC<never[]>(args)));
      logResult(logger, result);
      return result;
    } catch (e) {
      logger.error(fromRuntimeError(e));
      throw e;
    }
  });

export const ipcOn = <C extends string>(channel: C, listener: AnyFunc<void>) =>
  ipcMain.on(channel, (_, ...args: unknown[]) => {
    const logger = ipcLoggers().on[channel](args);
    listener(...fromIPC<never[]>(args));
    logger.info('success');
  });

export const ipcSend = <C extends string>(
  window: BrowserWindow,
  channel: C,
  ...args: unknown[]
) => {
  const logger = ipcLoggers().send[channel](args);
  logger.info('success');
  window.webContents.send(channel, ...args);
};

let invokeid = -1;

export async function ipcInvoke<C extends string, T>(
  window: BrowserWindow,
  channel: C,
  ...args: unknown[]
) {
  // フロントエンドの処理が失敗した場合は，プリロードがエラー（ErrorMessage）を返す
  return new Promise<Failable<T>>((resolve) => {
    const logger = ipcLoggers().invoke[channel](args);

    invokeid++;
    const sendId = invokeid.toString();
    const handleChannel = `handle:${channel}`;
    const listener = (
      _: Electron.IpcMainEvent,
      result: unknown,
      resultId: string
    ) => {
      if (sendId === resultId) {
        ipcMain.removeListener(handleChannel, listener);
        logger.info(['success', result]);
        resolve(fromIPC<Failable<T>>(result));
      }
    };

    ipcMain.on(handleChannel, listener);

    logger.info('start');
    window.webContents.send(channel, sendId, ...args);
  });
}
