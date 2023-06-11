import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import { BrowserWindow } from 'electron';
import { openBrowser, openFolder } from '../dummy/on';
import {
  getWorld,
  deleteWorld,
  getDefaultSettings,
  getSystemSettings,
  getVersions,
  getWorldAbbrs,
  getWorldContainers,
  pickDirectory,
  saveWorldSettings,
  setSystemSettings,
  setWorldContainers,
  validateNewWorldName,
  searchPlayer,
} from '../dummy/handle';
import { getRunningWorld } from '../core/server/server';
import { genUUID } from '../tools/uuid';
import { runCommand, runServer } from '../dummy/server';

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

    SearchPlayer: searchPlayer,

    ValidateNewWorldName: validateNewWorldName,

    GetRunningWorld: getRunningWorld,
    // UpdatetRunningWorld: updateRunningWorld,

    GenUUID: async () => genUUID(),
  },
});
