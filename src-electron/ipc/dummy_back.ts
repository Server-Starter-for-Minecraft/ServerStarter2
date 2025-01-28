import { BrowserWindow } from 'electron';
import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import { getRunningWorld } from '../core/server/server';
import {
  deleteWorld,
  getDefaultSettings,
  getDefaultWorld,
  getSystemSettings,
  getVersions,
  getWorld,
  getWorldAbbrs,
  getWorldContainers,
  pickDirectory,
  saveWorldSettings,
  searchPlayer,
  setSystemSettings,
  setWorldContainers,
  validateNewWorldName,
} from '../dummy/handle';
import { openBrowser, openFolder } from '../dummy/on';
import { runCommand, runServer } from '../dummy/server';
import { genUUID } from '../util/random/uuid';
import { testHandle, testOn } from './test';

export const getBackListener = (
  windowGetter: () => BrowserWindow | undefined
): BackListener<API> => ({
  on: {
    Command: runCommand,
    OpenBrowser: openBrowser,
    OpenFolder: openFolder,

    SWMTest: testOn,
  },
  handle: {
    RunServer: runServer,
    OpenDialog: pickDirectory(windowGetter),

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

    GetDefaultWorld: getDefaultWorld,

    GenUUID: async () => genUUID(),

    IWMTest: testHandle,
  },
});
