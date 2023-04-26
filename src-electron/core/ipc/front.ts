import { API } from 'src-electron/api/api';
import { FrontListener, FrontCaller } from 'src-electron/core/ipc/link';
import {
  ipcHandle,
  ipcInvoke,
  ipcOn,
  ipcSend,
} from 'src-electron/core/ipc/util';
import { BrowserWindow } from 'electron';

type ChanneledFunc<C, T extends (...args: any) => any> = { __channel__: C } & T;

/** MainからMainWindowの処理を呼び出し非同期で待機する */
export const invoke = <C extends string, T>(
  channel: C,
  window: BrowserWindow
) =>
  ((...args: any[]) =>
    ipcInvoke<C, T>(window, channel, ...args)) as ChanneledFunc<
    C,
    (...args: any[]) => Promise<T>
  >;

/** MainからMainWindowの処理を同期で発火する */
export const send = <C extends string>(channel: C, window: BrowserWindow) =>
  ((...args: any[]) => ipcSend(window, channel, ...args)) as ChanneledFunc<
    C,
    (...args: any[]) => void
  >;

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

export function getFrontAPIListener(window: BrowserWindow): FrontListener<API> {
  const result: ChanneledFrontListener<FrontListener<API>> = {
    on: {
      StartServer: send('StartServer', window),
      UpdateStatus: send('UpdateStatus', window),
      AddConsole: send('AddConsole', window),
    },
    handle: {
      AgreeEula: invoke('AgreeEula', window),
    },
  };
  return result;
}
