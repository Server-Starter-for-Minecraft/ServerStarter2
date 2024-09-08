import { BrowserWindow } from 'electron';
import { API } from 'src-electron/api/api';
import { getWorldPaths } from 'src-electron/core/world/paths';
import { BackListener } from 'src-electron/ipc/link';
import { getPlayer } from '../core/player/main';
import {
  deleteRemoteWorld,
  getRemoteWorlds,
  validateNewRemoteWorldName,
  validateRemoteSetting,
} from '../core/remote/remote';
import { getStaticResoure } from '../core/resource';
import { getCacheContents } from '../core/stores/cache';
import { getSystemSettings, setSystemSettings } from '../core/stores/system';
import { getAllLocalSaveData } from '../core/user/launcher/localSave';
import { getVersions } from '../core/version/version';
import { pickDialog } from '../core/world/dialog';
import { getAdditionalContent } from '../core/world/files/addtional/all';
import { validateNewWorldName } from '../core/world/name';
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
} from '../core/world/world';
import { readyWindow } from '../lifecycle/lifecycle';
import { openBrowser, openFolder } from '../tools/shell';
import { getGlobalIP } from '../util/ip';

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

    GetAdditionalContent: getAdditionalContent,

    PickDialog: pickDialog(windowGetter),
  },
});
