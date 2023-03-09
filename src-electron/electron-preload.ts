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

import type {
  IMainProcess,
  IConsoleProcess,
  IProgressProcess,
} from '../src/global';

import type {
  SendChannel,
  OnChannel,
  InvokeChannel,
  HandleChannel,
} from './core/api/channels';

// WindowからMainのイベントを発火
const send =
  (channel: OnChannel) =>
  (...args: any[]) =>
    ipcRenderer.send(channel, ...args);

// MianからWindowのイベントを発火
const on =
  (channel: SendChannel) =>
  (listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on(channel, listener);

// WindowでMainの処理を非同期で待機
const invoke =
  (channel: HandleChannel) =>
  (...args: any[]) =>
    ipcRenderer.invoke(channel, ...args);

// MainでWindowの処理を非同期で待機
const handle =
  (channel: InvokeChannel) =>
  (
    handler: (event: Electron.IpcRendererEvent, ...args: any[]) => Promise<any>
  ) => {
    const listener = (event: Electron.IpcRendererEvent, ...args: any[]) => {
      handler(event, ...args).then((result) =>
        ipcRenderer.send('__handle_' + channel, result)
      );
    };
    ipcRenderer.on(channel, listener);
  };

const API: IMainProcess = {
  readyServer: invoke('ReadyServer'),
  runServer: invoke('RunServer'),
  handleEula: handle('InvokeEula'),
};

const ProgressAPI: IProgressProcess = {
  onUpdateStatus: on('update-status'),
};

const ConsoleAPI: IConsoleProcess = {
  onAddConsole: on('add-console'),
  sendCommand: send('send-command'),
};

contextBridge.exposeInMainWorld('API', API);
contextBridge.exposeInMainWorld('ProgressAPI', ProgressAPI);
contextBridge.exposeInMainWorld('ConsoleAPI', ConsoleAPI);
