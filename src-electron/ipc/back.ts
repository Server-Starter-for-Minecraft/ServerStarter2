import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import { BrowserWindow } from 'electron';
import {
  getRunningWorld,
  runCommand,
  runServer,
  saveWorldSettings,
} from '../core/server/server';
import { getVersions } from '../core/version/version';
import {
  newWorld,
  getWorld,
  getWorldAbbrs,
  setWorld,
  createWorld,
} from '../core/world/world';
import { openBrowser, openFolder, pickDirectory } from '../tools/shell';
import { getSystemSettings, setSystemSettings } from '../core/stores/system';
import { validateNewWorldName } from '../core/world/name';
import { searchPlayer } from '../core/player/search';
import { getStaticResoure } from '../core/resource';
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
    GetStaticResouce: getStaticResoure,

    GetSystemSettings: getSystemSettings,
    SetSystemSettings: setSystemSettings,

    GetWorldAbbrs: getWorldAbbrs,

    GetWorld: getWorld,
    SetWorld: setWorld,
    NewWorld: newWorld,
    CreateWorld: createWorld,
    DeleteWorld: undefined,

    RunServer: runServer,

    SearchPlayer: searchPlayer,

    GetVersions: getVersions,

    ValidateNewWorldName: validateNewWorldName,

    PickDirectory: pickDirectory(windowGetter),

    IWMTest: testHandle,
  },
});
