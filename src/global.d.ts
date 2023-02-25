import { World } from "app/src-electron/core/server/world/world";

declare global {
  interface Window {
      API: IMainProcess;
  }
}

export interface IMainProcess {
  test: () => Promise<string>;
  runServer: (world:World) => null;
}