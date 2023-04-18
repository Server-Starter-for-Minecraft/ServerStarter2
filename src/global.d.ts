import {
  FrontAPI,
  FrontConsoleAPI,
  FrontProgressAPI,
} from 'app/src-electron/api/frontend';
import { IpcRendererEvent } from 'electron';

declare global {
  interface Window {
    API: FrontAPI;
    ProgressAPI: FrontProgressAPI;
    ConsoleAPI: FrontConsoleAPI;
  }
}

export interface IMainProcess {
  onStartServer: (callback: (event: IpcRendererEvent) => void) => void;
  runServer: (world: string) => Promise<void>;
  handleEula: (
    handler: (event: Electron.IpcRendererEvent) => Promise<boolean>
  ) => void;
}

export interface IProgressProcess {
  onUpdateStatus: (
    callback: (event: IpcRendererEvent, args: any[]) => void
  ) => void;
}

export interface IConsoleProcess {
  onAddConsole: (
    callback: (event: IpcRendererEvent, args: string[]) => void
  ) => void;
  sendCommand: (command: string) => void;
}
