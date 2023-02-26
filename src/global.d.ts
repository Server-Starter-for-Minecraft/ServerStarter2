import { World } from "app/src-electron/core/server/world/world";
import { IpcMainInvokeEvent } from "electron";

declare global {
  interface Window {
      API: IMainProcess;
      ProgressAPI: IProgressProcess;
  }
}

export interface IMainProcess {
  test: () => Promise<string>;
  runServer: (world:World) => Promise<boolean>;
}

export interface IProgressProcess {
  onUpdateStatus: (callback: (event: IpcMainInvokeEvent, args: string[]) => void) => void;
}