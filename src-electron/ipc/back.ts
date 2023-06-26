import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import {
  getRunningWorld,
  runCommand,
  runServer,
  saveWorldSettings,
} from '../core/server/server';
import { getVersions } from '../core/version/version';
import {
  deleteWorld,
  getDefaultWorld,
  getWorld,
  getWorldAbbrs,
} from '../core/world/world';
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
import { getStaticResoure } from '../core/resource';

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

    GetWorldContainers: getWorldContainers,
    SetWorldContainers: setWorldContainers,

    GetWorldAbbrs: getWorldAbbrs,

    GetWorld: getWorld,
    SetWorld: undefined,
    NewWorld: undefined,
    CreateWorld: undefined,
    DeleteWorld: undefined,

    RunServer: runServer,

    SearchPlayer: searchPlayer,

    GetVersions: getVersions,

    ValidateNewWorldName: validateNewWorldName,

    PickDirectory: pickDirectory(windowGetter),
  },
});
