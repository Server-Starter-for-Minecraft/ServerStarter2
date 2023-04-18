import { World } from './scheme';

export interface IAPI {
  sendMainToWindow: {
    [key in string]: (...args: any[]) => void;
  };
  invokeMainToWindow: {
    [key in string]: (...args: any[]) => Promise<any>;
  };
  sendWindowToMain: {
    [key in string]: (...args: any[]) => void;
  };
  invokeWindowToMain: {
    [key in string]: (...args: any[]) => Promise<any>;
  };
}

export interface API extends IAPI {
  sendMainToWindow: {
    StartServer: () => void;
    UpdateStatus: () => void;
    AddConsole: (chunk: string) => void;
  };
  invokeMainToWindow: {
    AgreeEula: () => Promise<boolean>;
  };
  sendWindowToMain: {
    Command: (command: string) => void;
  };
  invokeWindowToMain: {
    RunServer: (world: World) => Promise<void>;
  };
}
