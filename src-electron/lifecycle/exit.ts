import { shutdown } from '../util/shutdown';
import { onQuit } from './lifecycle';

/**
 * アプリケーションを終了してPCをシャットダウン
 */
export async function closeServerStarterAndShutDown() {
  await onQuit.invoke();
  _app.exit();
  await shutdown();
}

let _app: Electron.App;
/** electron-main以外から呼ばないこと */
export function setServerStarterApp(app: Electron.App) {
  _app = app;
}
