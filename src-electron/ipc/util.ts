import { BrowserWindow, ipcMain } from 'electron';

export const ipcHandle = <C extends string>(
  channel: C,
  listener: (...args: any[]) => any
) => ipcMain.handle(channel, (_, ...args: any[]) => listener(...args));

export const ipcOn = <C extends string>(
  channel: C,
  listener: (...args: any[]) => void
) => ipcMain.on(channel, (_, ...args: any[]) => listener(...args));

export const ipcSend = <C extends string>(
  window: BrowserWindow,
  channel: C,
  ...args: any[]
) => window.webContents.send(channel, ...args);

let invokeid = -1;

export function ipcInvoke<C extends string, T>(
  window: BrowserWindow,
  channel: C,
  ...args: any[]
) {
  return new Promise<T>((resolve) => {
    invokeid++;
    const sendId = invokeid.toString();
    const handleChannel = 'handle:' + channel;
    const listener = (
      _: Electron.IpcMainEvent,
      result: any,
      resultId: string
    ) => {
      if (sendId === resultId) {
        ipcMain.removeListener(handleChannel, listener);
        resolve(result);
      }
    };

    ipcMain.on(handleChannel, listener);
    window.webContents.send(channel, sendId, ...args);
  });
}
