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
import { IMainProcess, IConsoleProcess, IProgressProcess } from '../src/global';

const API: IMainProcess = {
  test: () => ipcRenderer.invoke('TEST'),
  readyServer: (world) => ipcRenderer.invoke('ReadyServer', world),
  runServer: (world) => ipcRenderer.invoke('RunServer', world),
};

const ProgressAPI: IProgressProcess = {
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
};

const ConsoleAPI: IConsoleProcess = {
  onAddConsole: (callback) => ipcRenderer.on('add-console', callback),
  sendCommand: (command: string) => ipcRenderer.send('send-command', command),
};

contextBridge.exposeInMainWorld('API', API);
contextBridge.exposeInMainWorld('ProgressAPI', ProgressAPI);
contextBridge.exposeInMainWorld('ConsoleAPI', ConsoleAPI);
