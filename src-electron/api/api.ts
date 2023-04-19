import { Failable } from '../core/utils/result';
import { World } from './scheme';
import { IAPI, Back, Front } from './types';

export interface API extends IAPI {
  sendMainToWindow: {
    StartServer: () => void;
    UpdateStatus: (message: string, ratio?: number) => void;
    AddConsole: (chunk: string) => void;
  };
  invokeMainToWindow: {
    AgreeEula: () => Promise<boolean>;
  };
  sendWindowToMain: {
    Command: (command: string) => void;
  };
  invokeWindowToMain: {
    RunServer: (world: World) => Promise<Failable<undefined>>;
  };
}

export type BackAPI = Back<API>;
export type FrontAPI = Front<API>;
