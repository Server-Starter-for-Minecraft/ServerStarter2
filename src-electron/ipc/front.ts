import { API } from 'src-electron/api/api';
import { FrontListener, FrontCaller } from 'src-electron/ipc/link';
import { ipcHandle, ipcInvoke, ipcOn, ipcSend } from 'src-electron/ipc/util';
import { BrowserWindow } from 'electron';
import { Failable } from '../util/error/failable';
import { errorMessage } from '../util/error/construct';

type ChanneledFunc<C, T extends (...args: any) => any> = { __channel__: C } & T;

/** MainからMainWindowの処理を呼び出し非同期で待機する */
export const invoke = <C extends string, T>(
  channel: C,
  window: () => BrowserWindow | undefined
) =>
  ((...args: any[]) => {
    const win = window();
    if (win !== undefined) return ipcInvoke<C, T>(win, channel, ...args);
    else
      return errorMessage.system.ipc({
        channel,
        type: 'invokeMainToWindow',
        message: 'window not exists',
      });
  }) as ChanneledFunc<C, (...args: any[]) => Promise<Failable<T>>>;

/** MainからMainWindowの処理を同期で発火する */
export const send = <C extends string>(
  channel: C,
  window: () => BrowserWindow | undefined
) =>
  ((...args: any[]) => {
    const win = window();
    if (win !== undefined) ipcSend(win, channel, ...args);
  }) as ChanneledFunc<C, (...args: any[]) => void>;

export function setFrontAPI(front: FrontCaller<API>) {
  Object.entries(front.invoke).forEach(([k, v]) => {
    ipcHandle(k, v);
  });
  Object.entries(front.send).forEach(([k, v]) => {
    ipcOn(k, v);
  });
}

type ChanneledFrontListener<L extends FrontListener<any>> = {
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
      UpdateStatus: send('UpdateStatus', window),
      AddConsole: send('AddConsole', window),
      UpdateSystemSettings: send('UpdateSystemSettings', window),
    },
    handle: {
      AgreeEula: invoke('AgreeEula', window),
    },
  };
  return result;
}
