import { BrowserWindow, ipcMain } from 'electron';
import { BackAPI } from '../api/backend';

// export async function invokeMainWindow<T>(
//   channel: InvokeChannel,
//   ...args: any[]
// ) {
//   if (mainWindow) {
//     return await ipcInvoke<T>(mainWindow, channel, ...args);
//   } else {
//     throw new Error('MainWindow not exists.');
//   }
// }

function getApi(window: BrowserWindow) {
  ipcMain.handle('Channel', (_e) => 100);
  window.webContents.send('Channel', 100, 200);

  const API: BackAPI = {
    sendStartServer: () => window.webContents.send('StartServer'),
    handleRunServer: (f) => ipcMain.handle('Channel', f),
    invokeEula: () => ATODE,
  };

  return API;
}
