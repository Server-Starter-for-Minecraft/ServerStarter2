import { shell } from 'electron';

export function openBrowser(url: string) {
  shell.openExternal(url);
}

export function openFolder(path: string) {
  shell.openPath(path);
}
