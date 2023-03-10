/* eslint @typescript-eslint/no-explicit-any: 0 */

import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'path';
import os from 'os';
import { runDummy, runCommand } from './core/server/dummyServer';
import { ipcHandle, ipcInvoke, ipcOn, ipcSend } from './ipc_util';
import { InvokeChannel, SendChannel } from './api/channels';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(
      path.join(app.getPath('userData'), 'DevTools Extensions')
    );
  }
} catch (_) {}

let mainWindow: BrowserWindow | undefined;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });

  ipcHandle('RunServer', runDummy);
  ipcOn('send-command', runCommand);
}

export async function invokeMainWindow<T>(
  channel: InvokeChannel,
  ...args: any[]
) {
  if (mainWindow) {
    return await ipcInvoke<T>(mainWindow, channel, ...args);
  } else {
    throw new Error('MainWindow not exists.');
  }
}

export function sendMainWindow(channel: SendChannel, ...args: any[]) {
  if (mainWindow) {
    ipcSend(mainWindow, channel, args);
  } else {
    throw new Error('MainWindow not exists.');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});
