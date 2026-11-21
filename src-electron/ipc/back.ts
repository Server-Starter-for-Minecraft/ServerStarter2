import { BrowserWindow } from 'electron';
import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import { runDetached } from 'app/src-public/scripts/promise/runDetached';
import { getVersions } from '../source/containers';
import {
  getAllLocalSaveData,
  getDetectedLocalSaveContainers,
} from '../source/launcher/localSave';
import { getPlayer, researchPlayer } from '../source/player/main';
import {
  deleteRemoteWorld,
  getRemoteWorlds,
  validateNewRemoteWorldName,
  validateRemoteSetting,
} from '../source/remote/remote';
import { getCacheContents } from '../source/stores/cache';
import { getSystemSettings, setSystemSettings } from '../source/stores/system';
import { getGlobalIP, openBrowser, openFolder } from '../source/system/os';
import { getStaticResoure } from '../source/system/resource';
import { readyWindow } from '../source/system/window';
import { getWorldContents } from '../source/world/contents';
import { pickDialog } from '../source/world/dialog';
import { validateNewWorldName } from '../source/world/name';
import { getWorldPaths } from '../source/world/paths';
import {
  backupWorld,
  createWorld,
  deleteWorld,
  duplicateWorld,
  fetchLatestWorldLog,
  getWorld,
  getWorldAbbrs,
  newWorld,
  reboot,
  restoreWorld,
  runCommand,
  runWorld,
  setWorld,
} from '../source/world/world';
import { ipcLoggers } from './util';

export const getBackListener = (
  windowGetter: () => BrowserWindow | undefined
): BackListener<API> => ({
  on: {
    // 送信（send）は結果を返さないため，非同期処理の失敗はここでログに残す
    Command: (worldID, command) =>
      runDetached(runCommand(worldID, command), (e) =>
        ipcLoggers().on.Command().error(e)
      ),
    OpenBrowser: (url) =>
      runDetached(openBrowser(url), (e) =>
        ipcLoggers().on.OpenBrowser().error(e)
      ),
    ReadyWindow: () =>
      runDetached(readyWindow(), (e) => ipcLoggers().on.ReadyWindow().error(e)),
  },
  handle: {
    Reboot: reboot,
    OpenFolder: openFolder,

    GetStaticResouce: getStaticResoure,

    GetSystemSettings: getSystemSettings,
    SetSystemSettings: setSystemSettings,

    GetWorldAbbrs: getWorldAbbrs,

    GetWorld: getWorld,
    SetWorld: setWorld,
    NewWorld: newWorld,
    CreateWorld: createWorld,
    DeleteWorld: deleteWorld,
    DuplicateWorld: duplicateWorld,
    BackupWorld: backupWorld,
    RestoreWorld: restoreWorld,

    RunWorld: runWorld,

    FetchLatestWorldLog: fetchLatestWorldLog,

    GetWorldPaths: getWorldPaths,
    GetWorldContents: getWorldContents,

    GetPlayer: getPlayer,
    ResearchPlayer: researchPlayer,

    GetVersions: getVersions,

    GetCacheContents: getCacheContents,

    GetGlobalIP: getGlobalIP,

    ValidateNewWorldName: validateNewWorldName,

    ValidateRemoteSetting: validateRemoteSetting,

    ValidateNewRemoteWorldName: validateNewRemoteWorldName,

    GetLocalSaveData: getAllLocalSaveData,
    GetDetectedLocalSaveContainers: getDetectedLocalSaveContainers,
    GetRemoteWorlds: getRemoteWorlds,
    DeleteRemoteWorld: deleteRemoteWorld,

    PickDialog: pickDialog(windowGetter),
  },
});
