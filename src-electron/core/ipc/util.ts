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

export function ipcInvoke<C extends string, T>(
  window: BrowserWindow,
  channel: C,
  ...args: any[]
) {
  return new Promise<T>((resolve) => {
    const sendId = crypto.randomUUID();
    ipcMain.on(
      'handle:' + channel,
      (_: Electron.IpcMainEvent, result: any, resultId: string) => {
        if (sendId === resultId) resolve(result);
      }
    );
    window.webContents.send(channel, sendId, ...args);
  });
}
