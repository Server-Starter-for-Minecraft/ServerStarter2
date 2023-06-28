import { BrowserWindow, dialog, shell } from 'electron';

export function openBrowser(url: string) {
  shell.openExternal(url);
}

export function openFolder(path: string) {
  shell.showItemInFolder(path);
}

export const openDialog =
  (windowGetter: () => BrowserWindow | undefined) =>
  async (
    options: Electron.OpenDialogOptions
  ): Promise<Electron.OpenDialogReturnValue> => {
    const window = windowGetter();
    // windowがない場合キャンセル状態の値を返す(Windowから呼ぶことを想定しているので、たぶん起こらない)
    if (!window) return { canceled: true, filePaths: [] };

    return await dialog.showOpenDialog(window, options);
  };
