/* eslint @typescript-eslint/no-explicit-any: 0 */

/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.ts you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */

import { contextBridge, ipcRenderer } from 'electron';
import { FrontHandle, FrontInvoke, FrontOn, FrontSend } from './api/types';
import { FrontAPI } from './api/api';

type Func<A extends any[], R> = (..._: A) => R;

// WindowからMainのイベントを発火
function send<C extends string>(channel: C): FrontSend<C, Func<any[], void>> {
  return ((...args: any[]) => ipcRenderer.send(channel, ...args)) as FrontSend<
    C,
    Func<any[], void>
  >;
}

// MainからWindowのイベントを発火
function on<C extends string>(channel: C): FrontOn<C, Func<any[], void>> {
  return ((
    listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
  ) => {
    ipcRenderer.on(channel, listener);
  }) as FrontOn<C, Func<any[], void>>;
}

// WindowでMainの処理を非同期で待機
function invoke<C extends string>(
  channel: C
): FrontInvoke<C, Func<any[], Promise<any>>> {
  return ((...args: any[]) =>
    ipcRenderer.invoke(channel, ...args)) as FrontInvoke<
    C,
    Func<any[], Promise<any>>
  >;
}

// MainでWindowの処理を非同期で待機
function handle<C extends string>(
  channel: C
): FrontHandle<C, Func<any[], Promise<any>>> {
  return ((
    handler: (event: Electron.IpcRendererEvent, ...args: any[]) => Promise<any>
  ) => {
    const listener = (event: Electron.IpcRendererEvent, ...args: any[]) => {
      handler(event, ...args).then((result) =>
        ipcRenderer.send('__handle_' + channel, result)
      );
    };
    ipcRenderer.on(channel, listener);
  }) as FrontHandle<C, Func<any[], Promise<any>>>;
}

const api: FrontAPI = {
  onStartServer: on('StartServer'),
  onUpdateStatus: on('UpdateStatus'),
  onAddConsole: on('AddConsole'),
  sendCommand: send('Command'),
  sendOpenBrowser: send('OpenBrowser'),
  handleAgreeEula: handle('AgreeEula'),
  invokeRunServer: invoke('RunServer'),
  invokeGetAllWorlds: invoke('GetAllWorlds'),
  invokeGetVersions: invoke('GetVersions'),
};

contextBridge.exposeInMainWorld('API', api);
