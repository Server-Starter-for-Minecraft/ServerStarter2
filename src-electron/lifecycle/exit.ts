import { api } from '../core/api';
import { fromRuntimeError } from '../util/error/error';
import { shutdown } from '../util/shutdown';

/**
 * アプリケーションを終了してPCをシャットダウン
 */
export async function closeServerStarterAndShutDown() {
  // これほんとに同期的に処理される？
  _app.quit();
  const result = await shutdown();
  if (result !== null) {
    // シャットダウンに失敗したらエラーをフロントに送ろうとする
    // ...けどこの時点でフロント画面が存在しないと思う
    api.send.Error(fromRuntimeError(result));
  }
}

let _app: Electron.App;
/** electron-main以外から呼ばないこと */
export function setServerStarterApp(app: Electron.App) {
  _app = app;
}
