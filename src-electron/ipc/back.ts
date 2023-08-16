import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import { BrowserWindow } from 'electron';
import { getVersions } from '../core/version/version';
import {
  newWorld,
  getWorld,
  getWorldAbbrs,
  setWorld,
  createWorld,
  deleteWorld,
  runWorld,
  runCommand,
  reboot,
  duplicateWorld,
} from '../core/world/world';
import { openBrowser, openFolder } from '../tools/shell';
import { getSystemSettings, setSystemSettings } from '../core/stores/system';
import { validateNewWorldName } from '../core/world/name';
import { getStaticResoure } from '../core/resource';
import { getPlayer } from '../core/player/main';
import { getAllLocalSaveData } from '../core/user/launcher/localSave';
import { getCacheContents } from '../core/stores/cache';
import { pickDialog } from '../core/world/dialog';
import { getGlobalIP } from '../util/ip';
import {
  deleteRemoteWorld,
  getRemoteWorlds,
  validateNewRemoteWorldName,
} from '../core/remote/remote';
export const getBackListener = (
  windowGetter: () => BrowserWindow | undefined
): BackListener<API> => ({
  on: {
    Command: runCommand,
    OpenBrowser: openBrowser,
    OpenFolder: openFolder,
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

    RunWorld: runWorld,

    GetPlayer: getPlayer,

    GetVersions: getVersions,

    GetCacheContents: getCacheContents,

    GetGlobalIP: getGlobalIP,

    ValidateNewWorldName: validateNewWorldName,

    ValidateNewRemoteWorldName: validateNewRemoteWorldName,

    GetLocalSaveData: getAllLocalSaveData,
    GetRemoteWorlds: getRemoteWorlds,
    DeleteRemoteWorld: deleteRemoteWorld,

    PickDialog: pickDialog(windowGetter),
  },
});
