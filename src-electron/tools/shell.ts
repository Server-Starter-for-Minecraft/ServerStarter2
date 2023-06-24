import { BrowserWindow, dialog, ipcMain, shell } from 'electron';

export function openBrowser(url: string) {
  shell.openExternal(url);
}

export function openFolder(path: string) {
  console.log("HELLOWORODASDAW")
  shell.showItemInFolder(path);
}

export const pickDirectory =
  (windowGetter: () => BrowserWindow | undefined) =>
  async (): Promise<Electron.OpenDialogReturnValue> => {
    const window = windowGetter();
    // windowがない場合キャンセル状態の値を返す(Windowから呼ぶことを想定しているので、たぶん起こらない)
    if (!window) return { canceled: true, filePaths: [] };
    return await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
    });
  };
