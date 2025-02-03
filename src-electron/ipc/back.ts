import { BrowserWindow } from 'electron';
import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import { readyWindow } from '../lifecycle/lifecycle';
import { getAllLocalSaveData } from '../source/launcher/localSave';
import { getPlayer } from '../source/player/main';
import {
  deleteRemoteWorld,
  getRemoteWorlds,
  validateNewRemoteWorldName,
  validateRemoteSetting,
} from '../source/remote/remote';
import { getCacheContents } from '../source/stores/cache';
import { getSystemSettings, setSystemSettings } from '../source/stores/system';
import { getStaticResoure } from '../source/system/resource';
import { getVersions } from '../source/version/version';
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
import { getGlobalIP } from '../util/network/ip';
import { openBrowser, openFolder } from '../util/os/shell';

export const getBackListener = (
  windowGetter: () => BrowserWindow | undefined
): BackListener<API> => ({
  on: {
    Command: runCommand,
    OpenBrowser: openBrowser,
    OpenFolder: openFolder,
    ReadyWindow: readyWindow,
  },
  handle: {
    Reboot: reboot,

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

    GetPlayer: getPlayer,

    GetVersions: getVersions,

    GetCacheContents: getCacheContents,

    GetGlobalIP: getGlobalIP,

    ValidateNewWorldName: validateNewWorldName,

    ValidateRemoteSetting: validateRemoteSetting,

    ValidateNewRemoteWorldName: validateNewRemoteWorldName,

    GetLocalSaveData: getAllLocalSaveData,
    GetRemoteWorlds: getRemoteWorlds,
    DeleteRemoteWorld: deleteRemoteWorld,

    PickDialog: pickDialog(windowGetter),
  },
});
