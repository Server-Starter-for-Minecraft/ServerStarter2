import { shell } from 'electron';

export function openBrowser(url: string) {
  shell.openExternal(url)
}