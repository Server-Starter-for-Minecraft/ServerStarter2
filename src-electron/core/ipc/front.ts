import { API } from 'app/src-electron/api/api';
import { FrontListener, Front } from 'app/src-electron/core/ipc/link';
import {
  ipcHandle,
  ipcInvoke,
  ipcOn,
  ipcSend,
} from 'app/src-electron/core/ipc/util';
import { BrowserWindow } from 'electron';

/** MainからMainWindowの処理を呼び出し非同期で待機する */
export const invoke =
  <C extends string, T>(channel: C, window: BrowserWindow) =>
  async (...args: any[]) => {
    return await ipcInvoke<C, T>(window, channel, ...args);
  };

/** MainからMainWindowの処理を同期で発火する */
export const send =
  <C extends string>(channel: C, window: BrowserWindow) =>
  async (...args: any[]) => {
    ipcSend(window, channel, ...args);
  };

export function setFrontAPI(front: Front<API>) {
  Object.entries(front.invoke).forEach(([k, v]) => {
    ipcHandle(k, v);
  });
  Object.entries(front.send).forEach(([k, v]) => {
    ipcOn(k, v);
  });
}

export function getFrontAPIListener(window: BrowserWindow): FrontListener<API> {
  return {
    on: {
      StartServer: send('StartServer', window),
      UpdateStatus: send('UpdateStatus', window),
      AddConsole: send('AddConsole', window),
    },
    handle: {
      AgreeEula: invoke('AgreeEula', window),
    },
  };
}
