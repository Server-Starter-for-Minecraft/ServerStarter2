import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import {
  getRunningWorld,
  runCommand,
  runServer,
  saveWorldSettings,
} from '../core/server/server';
import { getVersions } from '../core/version/version';
import { deleteWorld, getWorld, getWorldAbbrs } from '../core/world/world';
import { openBrowser, openFolder, pickDirectory } from '../tools/shell';
import {
  getWorldContainers,
  setWorldContainers,
} from '../core/world/worldContainer';
import { getDefaultSettings } from '../core/settings/settings';
import { getSystemSettings, setSystemSettings } from '../core/stores/system';
import { genUUID } from 'src-electron/tools/uuid';
import { validateNewWorldName } from '../core/world/name';
import { BrowserWindow } from 'electron';
import { searchPlayer } from '../core/player/search';

export const getBackListener = (
  windowGetter: () => BrowserWindow | undefined
): BackListener<API> => ({
  on: {
    Command: runCommand,
    OpenBrowser: openBrowser,
    OpenFolder: openFolder,
  },
  handle: {
    RunServer: runServer,
    PickDirectory: pickDirectory(windowGetter),

    DeleteWorld: deleteWorld,

    SaveWorldSettings: saveWorldSettings,

    GetSystemSettings: getSystemSettings,
    SetSystemSettings: setSystemSettings,

    GetDefaultSettings: getDefaultSettings,
    GetVersions: getVersions,
    GetWorldContainers: getWorldContainers,
    SetWorldContainers: setWorldContainers,
    GetWorldAbbrs: getWorldAbbrs,
    GetWorld: getWorld,

    ValidateNewWorldName: validateNewWorldName,

    GetRunningWorld: getRunningWorld,
    // UpdatetRunningWorld: updateRunningWorld,

    SearchPlayer: searchPlayer,

    GenUUID: async () => genUUID(),
  },
});
