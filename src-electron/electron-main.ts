/* eslint @typescript-eslint/no-explicit-any: 0 */
import { app, BrowserWindow, nativeTheme } from 'electron';
import * as os from 'os';
import * as path from 'path';
import { getSystemSettings, setSystemSettings } from './core/stores/system';
import { setupIPC } from './ipc/setup';
import { setServerStarterApp } from './lifecycle/exit';
import { onQuit } from './lifecycle/lifecycle';
import { update } from './updater/updater';
import { getCurrentTimestamp } from './util/timestamp';

// 多重起動していたらすでに起動済みの場合即時終了
if (!app.requestSingleInstanceLock()) app.quit();

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

async function createWindow() {
  /**
   * Initial window options
   */

  // 環境変数SERVERSTARTER_MODEがnoupdateでない場合アップデートをチェック
  if (process.env.SERVERSTARTER_MODE !== 'noupdate') {
    await update();
  }

  // TODO: アップデートしたときだけ処理を走らせる方法の検討
  const sys = await getSystemSettings();
  if (sys.system.lastUpdatedTime === undefined) {
    sys.system.lastUpdatedTime = getCurrentTimestamp(true);
    await setSystemSettings(sys);
  }

  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    minWidth: 650,
    minHeight: 650,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  mainWindow.loadURL(process.env.APP_URL);
  mainWindow.maximize();

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.removeMenu();
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
  await onQuit.invoke();
  app.quit();
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

/** exitをどこからでも呼べるように登録する */
setServerStarterApp(app);
