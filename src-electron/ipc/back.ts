import { BrowserWindow } from 'electron';
import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import { getWorldPaths } from '../core/world/paths';
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

function todo(message: `TODO:${string}`): never {
  throw new Error(message);
}

export const getBackListener = (
  windowGetter: () => BrowserWindow | undefined
): BackListener<API> => ({
  on: {
    Command: todo('TODO:'),
    OpenBrowser: openBrowser,
    OpenFolder: openFolder,
    ReadyWindow: readyWindow,
  },
  handle: {
    Reboot: todo('TODO:'),

    GetStaticResouce: getStaticResoure,

    GetSystemSettings: getSystemSettings,
    SetSystemSettings: setSystemSettings,

    GetWorldAbbrs: todo('TODO:'),

    GetWorld: todo('TODO:'),
    SetWorld: todo('TODO:'),
    NewWorld: todo('TODO:'),
    CreateWorld: todo('TODO:'),
    DeleteWorld: todo('TODO:'),
    DuplicateWorld: todo('TODO:'),

    BackupWorld: todo('TODO:'),
    RestoreWorld: todo('TODO:'),

    RunWorld: todo('TODO:'),

    FetchLatestWorldLog: todo('TODO:'),

    GetWorldPaths: todo('TODO:'),

    GetPlayer: todo('TODO:'),

    GetVersions: todo('TODO:'),

    GetCacheContents: todo('TODO:'),

    GetGlobalIP: getGlobalIP,

    ValidateNewWorldName: todo('TODO:'),

    ValidateRemoteSetting: todo('TODO:'),

    ValidateNewRemoteWorldName: todo('TODO:'),

    GetLocalSaveData: getAllLocalSaveData,

    GetRemoteWorlds: todo('TODO:'),
    DeleteRemoteWorld: todo('TODO:'),

    PickDialog: pickDialog(windowGetter),
  },
});
