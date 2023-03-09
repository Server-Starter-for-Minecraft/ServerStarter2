import { invokeMainWindow } from 'app/src-electron/electron-main';

export function invokeEula() {
  return invokeMainWindow<boolean>('InvokeEula');
}
