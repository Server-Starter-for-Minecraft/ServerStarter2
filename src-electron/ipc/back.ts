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
} from '../core/world/world';
import { openBrowser, openFolder, openDialog } from '../tools/shell';
import { getSystemSettings, setSystemSettings } from '../core/stores/system';
import { validateNewWorldName } from '../core/world/name';
import { getStaticResoure } from '../core/resource';
import { getPlayer } from '../core/player/main';
import { getLocalSaveData } from '../core/user/localSave';

export const getBackListener = (
  windowGetter: () => BrowserWindow | undefined
): BackListener<API> => ({
  on: {
    Command: runCommand,
    OpenBrowser: openBrowser,
    OpenFolder: openFolder,
  },
  handle: {
    GetStaticResouce: getStaticResoure,

    GetSystemSettings: getSystemSettings,
    SetSystemSettings: setSystemSettings,

    GetWorldAbbrs: getWorldAbbrs,

    GetWorld: getWorld,
    SetWorld: setWorld,
    NewWorld: newWorld,
    CreateWorld: createWorld,
    DeleteWorld: deleteWorld,

    RunWorld: runWorld,

    GetPlayer: getPlayer,

    GetVersions: getVersions,

    ValidateNewWorldName: validateNewWorldName,

    GetLocalSaveData: getLocalSaveData,

    OpenDialog: openDialog(windowGetter),
  },
});
