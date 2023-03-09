import { World } from 'app/src-electron/core/server/world/world';
import { IpcRendererEvent } from 'electron';

declare global {
  interface Window {
    API: IMainProcess;
    ProgressAPI: IProgressProcess;
    ConsoleAPI: IConsoleProcess;
  }
}

export interface IMainProcess {
  test: () => Promise<string>;
  readyServer: (world: World) => Promise<void>;
  runServer: (world: World) => Promise<void>;
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
