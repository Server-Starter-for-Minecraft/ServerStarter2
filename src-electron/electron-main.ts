import {
  registerQuasarRuntime,
  resolveElectronAssetsPath,
} from '#q-app/electron/main';
import { app, BrowserWindow, nativeTheme } from 'electron';
import { runDetached } from 'app/src-public/scripts/promise/runDetached';
import { setupIPC } from './ipc/setup';
import { setServerStarterApp } from './lifecycle/exit';
import { onQuit } from './lifecycle/lifecycle';
import { rootLogger } from './logger/logger';
import { getSystemSettings, setSystemSettings } from './source/stores/system';
import { update } from './updater/updater';
import { Path } from './util/binary/path';
import { isError } from './util/error/error';
import { safeExecAsync } from './util/error/failable';
import { osPlatform } from './util/os/os';
import { getCurrentTimestamp } from './util/timestamp';

const loggers = () => rootLogger.main;

// 多重起動していたらすでに起動済みの場合即時終了
if (!app.requestSingleInstanceLock()) app.quit();

/** ダークモードの Windows で DevTools の拡張機能の設定を削除する */
async function removeDevToolsExtensions() {
  if (
    osPlatform === 'windows-x64' &&
    nativeTheme.shouldUseDarkColors === true
  ) {
    return new Path(app.getPath('userData'))
      .child('DevTools Extensions')
      .remove();
  }
}

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
    icon: resolveElectronAssetsPath('icons/icon.png'), // tray icon
    minWidth: 650,
    minHeight: 650,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: new Path(import.meta.dirname).child('electron-preload.cjs').path,
    },
  });

  // Shift+クリック等でリンクが新規ウィンドウとして開かれ、空の画面が起動するのを防ぐ
  // (外部ページはsendOpenBrowserで既定のブラウザに開くため、アプリ内で新規ウィンドウを開く必要はない)
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (import.meta.env.QUASAR_DEV) {
    await mainWindow.loadURL(import.meta.env.QUASAR_APP_URL);
  } else {
    await mainWindow.loadFile('index.html');
  }
  mainWindow.maximize();

  if (import.meta.env.QUASAR_DEBUG) {
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
  // SCPへの警告を無視（今回はソフトウェアのためXSS対策は実施しない）
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

runDetached(
  (async () => {
    await app.whenReady();
    registerQuasarRuntime();
    runDetached(removeDevToolsExtensions(), (e) =>
      loggers().removeDevToolsExtensions().warn(e)
    );
    await createWindow();
  })(),
  (e) => loggers().whenReady().error(e)
);

/**
 * 終了時の処理を実行してからアプリを終了する
 *
 * 終了時の処理が失敗してもアプリが終了できなくならないよう，失敗はログに残して終了する
 */
async function quitAfterCleanup() {
  const result = await safeExecAsync(async () => onQuit.invoke());
  if (isError(result)) loggers().quit().error(result);
  app.quit();
}

app.on('window-all-closed', () => {
  runDetached(quitAfterCleanup(), (e) => loggers().quit().error(e));
});

// will-quitのタイミングで終了時処理を走らせる
let finishedWillQuitEvent = false;
app.on('will-quit', (e) => {
  if (!finishedWillQuitEvent) {
    e.preventDefault();
    finishedWillQuitEvent = true;
    runDetached(quitAfterCleanup(), (e) => loggers().quit().error(e));
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    runDetached(createWindow(), (e) => loggers().activate().error(e));
  }
});

/** exitをどこからでも呼べるように登録する */
setServerStarterApp(app);
