import { BrowserWindow, ipcMain } from 'electron';
import { rootLoggerHierarchy } from '../core/logger';
import { assertComplete } from '../lifecycle/lifecycle';

export const ipcLoggers = rootLoggerHierarchy.ipc;

export const ipcHandle = <C extends string>(
  channel: C,
  listener: (...args: any[]) => Promise<any>
) =>
  ipcMain.handle(channel, (_, ...args: any[]) => {
    const logger = ipcLoggers.handle[channel](args);
    logger.start();
    const result = listener(...args);
    result.then(
      (x) => {
        logger.success(x);
        return x;
      },
      (x) => {
        logger.fail(x);
        return x;
      }
    );
    return assertComplete(result);
  });

export const ipcOn = <C extends string>(
  channel: C,
  listener: (...args: any[]) => void
) =>
  ipcMain.on(channel, (_, ...args: any[]) => {
    const logger = ipcLoggers.on[channel](args);
    listener(...args);
    logger.success();
  });

export const ipcSend = <C extends string>(
  window: BrowserWindow,
  channel: C,
  ...args: any[]
) => {
  const logger = ipcLoggers.send[channel](args);
  logger.success();
  window.webContents.send(channel, ...args);
};

let invokeid = -1;

export function ipcInvoke<C extends string, T>(
  window: BrowserWindow,
  channel: C,
  ...args: any[]
) {
  return new Promise<T>((resolve) => {
    const logger = ipcLoggers.invoke[channel](args);

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
        logger.success(result);
        resolve(result);
      }
    };

    ipcMain.on(handleChannel, listener);

    logger.start();
    window.webContents.send(channel, sendId, ...args);
  });
}
