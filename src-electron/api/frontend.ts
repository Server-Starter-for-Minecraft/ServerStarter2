import { API, ConsoleAPI, IAPI, ProgressAPI } from './api';
import {
  InvokeMainToWindow,
  InvokerWindowToMain,
  SendMainToWindow,
  SendWindowToMain,
  Func,
} from './ipc';

export type FrontSend<C extends string, F extends Func<any, void>> = F & {
  __channel__: C;
};

export type FrontInvoke<
  C extends string,
  F extends Func<any, Promise<any>>
> = F & {
  __channel__: C;
};

export type FrontOn<C extends string, F extends Func<any, void>> = ((
  listener: (event: Electron.IpcRendererEvent, ...args: Parameters<F>) => void
) => void) & {
  __channel__: C;
};

export type FrontHandle<C extends string, F extends Func<any, void>> = ((
  listener: (
    event: Electron.IpcRendererEvent,
    ...args: Parameters<F>
  ) => ReturnType<F>
) => void) & {
  __channel__: C;
};

type Front<T extends IAPI> = {
  sendMainToWindow:{
    [K in keyof T["sendMainToWindow"]]:0
  }
};

export type FrontAPI = Front<API>;
