import { BrowserWindow, dialog, ipcMain, shell } from 'electron';

export function openBrowser(url: string) {
  shell.openExternal(url);
}

export function openFolder(path: string) {
  shell.showItemInFolder(path);
}

export const pickDirectory =
  (windowGetter: () => BrowserWindow | undefined) => async () => {
    const window = windowGetter();
    // TODO: エラーログ出力が必要か
    if (!window) return '';
    return JSON.stringify(
      await dialog.showOpenDialog(window, {
        properties: ['openDirectory'],
      })
    );
  };
