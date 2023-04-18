import { API } from './api';
import {
  InvokeMainToWindow,
  InvokerWindowToMain,
  SendMainToWindow,
  SendWindowToMain,
} from './ipc';

type IpcMethod =
  | SendWindowToMain<any>
  | SendMainToWindow<any>
  | InvokerWindowToMain<any>
  | InvokeMainToWindow<any>;

type Backed<T extends IpcMethod> = T extends SendWindowToMain<any>
  ? BackSendWindowToMain<T>
  : T extends SendMainToWindow<any>
  ? BackSendMainToWindow<T>
  : T extends InvokerWindowToMain<any>
  ? BackInvokerWindowToMain<T>
  : T extends InvokeMainToWindow<any>
  ? BackInvokeMainToWindow<T>
  : never;

type BackSendWindowToMain<T extends SendWindowToMain<any>> = (
  listener: (
    event: Electron.IpcMainEvent,
    ...args: Parameters<T['func']>
  ) => void
) => void;

type BackInvokerWindowToMain<T extends InvokerWindowToMain<any>> = (
  listener: (
    event: Electron.IpcMainInvokeEvent,
    ...args: Parameters<T['func']>
  ) => ReturnType<T['func']>
) => void;

type BackSendMainToWindow<T extends SendMainToWindow<any>> = T['func'];

type BackInvokeMainToWindow<T extends InvokeMainToWindow<any>> = T['func'];

type Back<T extends { [key in string]: IpcMethod }> = {
  [key in keyof T as BackKeyName<Extract<key, string>, T[key]>]: Backed<T[key]>;
};

type BackKeyName<
  K extends string,
  V extends IpcMethod
> = V extends SendWindowToMain<any>
  ? `on${K}`
  : V extends SendMainToWindow<any>
  ? `send${K}`
  : V extends InvokerWindowToMain<any>
  ? `handle${K}`
  : V extends InvokeMainToWindow<any>
  ? `invoke${K}`
  : never;

export type BackAPI = Back<API>;
