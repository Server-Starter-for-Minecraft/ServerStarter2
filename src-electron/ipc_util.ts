import { BrowserWindow, ipcMain } from 'electron';
import {
  HandleChannel,
  InvokeChannel,
  OnChannel,
  SendChannel,
} from './core/api/channels';

export const ipcHandle: (
  channel: HandleChannel,
  listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any
) => void = ipcMain.handle;

export const ipcOn = (
  channel: OnChannel,
  listener: (event: Electron.IpcMainEvent, ...args: any[]) => void
) => ipcMain.on(channel, listener);

export const ipcSend = (
  window: BrowserWindow,
  channel: SendChannel,
  ...args: any[]
) => window.webContents.send(channel, ...args);

export async function ipcInvoke<T>(
  window: BrowserWindow,
  channel: InvokeChannel,
  ...args: any[]
) {
  return await new Promise<T>((resolve) => {
    ipcMain.on(
      '__handle_' + channel,
      (event: Electron.IpcMainEvent, result: any) => {
        resolve(result);
      }
    );
    window.webContents.send(channel, ...args);
  });
}
