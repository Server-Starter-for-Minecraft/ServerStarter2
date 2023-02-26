import { sendMainWindow } from "app/src-electron/electron-main";

export function setProgressStatus(title:string) {
  sendMainWindow('update-status', title)
}

export function addConsole(text:string) {
  sendMainWindow('add-console', text)
}