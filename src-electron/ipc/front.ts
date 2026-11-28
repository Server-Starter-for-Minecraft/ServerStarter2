import { BrowserWindow } from 'electron';
import { API } from 'src-electron/api/api';
import { AnyFunc, IAPI } from 'src-electron/api/types';
import { FrontCaller, FrontListener } from 'src-electron/ipc/link';
import { ipcHandle, ipcInvoke, ipcOn, ipcSend } from 'src-electron/ipc/util';
import { errorMessage } from '../util/error/construct';
import { Failable } from '../util/error/failable';

type ChanneledFunc<C, T extends AnyFunc<unknown>> = { __channel__: C } & T;

/**
 * 関数に，API の名前（チャンネル）を付ける
 *
 * @param channel チャンネル
 * @param func 関数
 * @returns チャンネルを付けた関数
 */
function withChannel<C extends string, F extends AnyFunc<unknown>>(
  channel: C,
  func: F
): ChanneledFunc<C, F> {
  return Object.assign(func, { __channel__: channel });
}

/** MainからMainWindowの処理を呼び出し非同期で待機する */
export const invoke = <C extends string, T>(
  channel: C,
  window: () => BrowserWindow | undefined
) =>
  withChannel(channel, async (...args: unknown[]): Promise<Failable<T>> => {
    const win = window();
    if (win !== undefined) return ipcInvoke<C, T>(win, channel, ...args);
    else
      return errorMessage.system.ipc({
        channel,
        type: 'invokeMainToWindow',
        message: 'window not exists',
      });
  });

/** MainからMainWindowの処理を同期で発火する */
export const send = <C extends string>(
  channel: C,
  window: () => BrowserWindow | undefined
) =>
  withChannel(channel, (...args: unknown[]) => {
    const win = window();
    if (win !== undefined) ipcSend(win, channel, ...args);
  });

export function setFrontAPI(front: FrontCaller<API>) {
  Object.entries(front.invoke).forEach(([k, v]) => {
    ipcHandle(k, v);
  });
  Object.entries(front.send).forEach(([k, v]) => {
    ipcOn(k, v);
  });
}

type ChanneledFrontListener<L extends FrontListener<IAPI>> = {
  on: {
    [key in keyof L['on']]: ChanneledFunc<key, L['on'][key]>;
  };
  handle: {
    [key in keyof L['handle']]: ChanneledFunc<key, L['handle'][key]>;
  };
};

export function getFrontAPIListener(
  window: () => BrowserWindow | undefined
): FrontListener<API> {
  const result: ChanneledFrontListener<FrontListener<API>> = {
    on: {
      StartServer: send('StartServer', window),
      FinishServer: send('FinishServer', window),
      Progress: send('Progress', window),
      AddConsole: send('AddConsole', window),
      UpdateOnlinePlayers: send('UpdateOnlinePlayers', window),
      Error: send('Error', window),
      NotifySystemUpdate: send('NotifySystemUpdate', window),
      UpdateOuterResources: send('UpdateOuterResources', window),
    },
    handle: {
      AgreeEula: invoke('AgreeEula', window),
      CheckShutdown: invoke('CheckShutdown', window),
    },
  };
  return result;
}
