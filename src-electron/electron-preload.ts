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
import { API, FrontAPI } from './api/api';
import { fromIPC } from './api/boundary';
import { AnyFunc } from './api/types';

/**
 * 関数に，API の名前（チャンネル）を付ける
 *
 * `FrontAPI` の型（`FrontSend` など）はチャンネルを持つため，API の名前とチャンネルの対応の誤りを型チェックで検出できる
 *
 * @param channel チャンネル
 * @param func 関数
 * @returns チャンネルを付けた関数
 */
function withChannel<C extends string, F extends AnyFunc<unknown>>(
  channel: C,
  func: F
) {
  return Object.assign(func, { __channel__: channel });
}

// WindowからMainのイベントを発火
function send<C extends string>(channel: C) {
  return withChannel(channel, (...args: unknown[]) =>
    ipcRenderer.send(channel, ...args)
  );
}

// MainからWindowのイベントを発火
function on<C extends string>(channel: C) {
  return withChannel(
    channel,
    (
      listener: (event: Electron.IpcRendererEvent, ...args: never[]) => void
    ) => {
      ipcRenderer.on(channel, (event, ...args: unknown[]) =>
        listener(event, ...fromIPC<never[]>(args))
      );
    }
  );
}

/** フロントエンドから呼び出して結果を待つ API の定義 */
type WindowToMain = API['invokeWindowToMain'];

/**
 * フロントエンドからバックエンドの処理を呼び出して結果を待つ関数を作る
 *
 * API の関数の型はオーバーロード・ジェネリクスを含むため，処理を転送する関数をチャンネルの API の型として扱う
 * （型はチャンネルから引くため，`FrontAPI` の項目とチャンネルの対応の誤りは型チェックで検出される）
 *
 * @param channel チャンネル（API の名前）
 * @returns チャンネルの API の型の関数
 */
function invoke<C extends keyof WindowToMain & string>(channel: C) {
  const forward = async (...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args);
  return withChannel(channel, fromIPC<WindowToMain[C]>(forward));
}

// MainでWindowの処理を非同期で待機
function handle<C extends string>(channel: C) {
  return withChannel(
    channel,
    (
      handler: (
        event: Electron.IpcRendererEvent,
        ...args: never[]
      ) => Promise<unknown>
    ) => {
      const listener = (
        event: Electron.IpcRendererEvent,
        id: string,
        ...args: unknown[]
      ) => {
        // 処理が失敗した場合もバックエンドへ結果を返す（返さないとバックエンドが応答を待ち続けて止まる）
        handler(event, ...fromIPC<never[]>(args)).then(
          (result) => ipcRenderer.send(`handle:${channel}`, result, id),
          (e: unknown) =>
            ipcRenderer.send(
              `handle:${channel}`,
              {
                type: 'error',
                key: 'system.ipc',
                level: 'error',
                arg: {
                  channel,
                  type: 'invokeMainToWindow',
                  message: e instanceof Error ? e.message : String(e),
                },
              },
              id
            )
        );
      };
      ipcRenderer.on(channel, listener);
    }
  );
}

const api: FrontAPI = {
  // ON
  onStartServer: on('StartServer'),
  onFinishServer: on('FinishServer'),
  onProgress: on('Progress'),
  onAddConsole: on('AddConsole'),
  onUpdateOnlinePlayers: on('UpdateOnlinePlayers'),
  onError: on('Error'),
  onNotifySystemUpdate: on('NotifySystemUpdate'),
  onUpdateOuterResources: on('UpdateOuterResources'),

  // HANDLE
  handleAgreeEula: handle('AgreeEula'),
  handleCheckShutdown: handle('CheckShutdown'),

  // SEND
  sendCommand: send('Command'),
  sendOpenBrowser: send('OpenBrowser'),
  sendReadyWindow: send('ReadyWindow'),

  // INVOKE
  invokeReboot: invoke('Reboot'),
  invokeOpenFolder: invoke('OpenFolder'),

  invokeGetStaticResouce: invoke('GetStaticResouce'),
  invokeGetOuterResources: invoke('GetOuterResources'),

  invokeGetSystemSettings: invoke('GetSystemSettings'),
  invokeSetSystemSettings: invoke('SetSystemSettings'),

  invokeGetWorldAbbrs: invoke('GetWorldAbbrs'),

  invokeGetWorld: invoke('GetWorld'),
  invokeSetWorld: invoke('SetWorld'),
  invokeNewWorld: invoke('NewWorld'),
  invokeCreateWorld: invoke('CreateWorld'),
  invokeDeleteWorld: invoke('DeleteWorld'),
  invokeDuplicateWorld: invoke('DuplicateWorld'),
  invokeBackupWorld: invoke('BackupWorld'),
  invokeRestoreWorld: invoke('RestoreWorld'),

  invokeRunWorld: invoke('RunWorld'),

  invokeFetchLatestWorldLog: invoke('FetchLatestWorldLog'),

  invokeGetWorldPaths: invoke('GetWorldPaths'),
  invokeGetWorldContents: invoke('GetWorldContents'),

  invokeGetPlayer: invoke('GetPlayer'),
  invokeResearchPlayer: invoke('ResearchPlayer'),

  invokeGetVersions: invoke('GetVersions'),

  invokeGetCacheContents: invoke('GetCacheContents'),

  invokeGetLocalSaveData: invoke('GetLocalSaveData'),
  invokeGetDetectedLocalSaveContainers: invoke(
    'GetDetectedLocalSaveContainers'
  ),

  invokeValidateRemoteSetting: invoke('ValidateRemoteSetting'),

  invokeGetRemoteWorlds: invoke('GetRemoteWorlds'),
  invokeDeleteRemoteWorld: invoke('DeleteRemoteWorld'),

  invokeGetGlobalIP: invoke('GetGlobalIP'),

  invokeValidateNewWorldName: invoke('ValidateNewWorldName'),

  invokeValidateNewRemoteWorldName: invoke('ValidateNewRemoteWorldName'),

  invokePickDialog: invoke('PickDialog'),
};

contextBridge.exposeInMainWorld('API', api);
