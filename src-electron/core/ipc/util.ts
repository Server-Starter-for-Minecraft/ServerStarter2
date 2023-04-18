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

export async function ipcInvoke<C extends string, T>(
  window: BrowserWindow,
  channel: C,
  ...args: any[]
) {
  return await new Promise<T>((resolve) => {
    ipcMain.on(
      '__handle_' + channel,
      (_: Electron.IpcMainEvent, result: any) => {
        resolve(result);
      }
    );
    window.webContents.send(channel, ...args);
  });
}
