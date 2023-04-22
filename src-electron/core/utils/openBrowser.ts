import { shell } from 'electron';

export function openBrowser(url: string) {
  console.log(url)
  shell.openExternal(url)
}