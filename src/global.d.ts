import { World } from "app/src-electron/core/server/world/world";
import { IpcMainInvokeEvent } from "electron";

declare global {
  interface Window {
      API: IMainProcess;
      ProgressAPI: IProgressProcess;
      ConsoleAPI: IConsoleProcess;
  }
}

export interface IMainProcess {
  test: () => Promise<string>;
  readyServer: (world:World) => Promise<void>;
  runServer: (world:World) => Promise<void>;
}

export interface IProgressProcess {
  onUpdateStatus: (callback: (event: IpcMainInvokeEvent, args: any[]) => void) => void;
}

export interface IConsoleProcess {
  onAddConsole: (callback: (event: IpcMainInvokeEvent, args: string[]) => void) => void;
}