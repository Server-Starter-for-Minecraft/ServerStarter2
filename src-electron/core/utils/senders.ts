import { sendMainWindow } from "app/src-electron/electron-main";

export function setProgressStatus(title:string, progressRatio=-1) {
  sendMainWindow('update-status', title, progressRatio)
}

export function addConsole(text:string) {
  sendMainWindow('add-console', text)
}