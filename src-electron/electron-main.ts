/* eslint @typescript-eslint/no-explicit-any: 0 */

import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'path';
import os from 'os';
import { setupIPC } from './ipc/setup';
import { onQuit } from './lifecycle/lifecycle';
import { sleep } from './util/testTools';

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
    width: 700,
    height: 750,
    minWidth: 550,
    minHeight: 600,
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

  // フロントエンドとバックエンドの呼び出し処理をリンク
  setupIPC(() => mainWindow);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (platform !== 'darwin') {
    await onQuit.invoke();
    app.quit();
  }
});

// will-quitのタイミングで終了時処理を走らせる
let finishedWillQuitEvent = false;
app.on('will-quit', async (e) => {
  if (!finishedWillQuitEvent) {
    e.preventDefault();
    await onQuit.invoke();
    finishedWillQuitEvent = true;
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});
