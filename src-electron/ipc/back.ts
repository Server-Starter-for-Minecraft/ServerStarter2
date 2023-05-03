import { API } from 'src-electron/api/api';
import { BackListener } from 'app/src-electron/ipc/link';
import {
  runCommand,
  runServer,
  saveWorldSettings,
} from '../core/server/server';
import { getVersions } from '../core/version/version';
import { getWorld, getWorldAbbrs } from '../core/world/world';
import { openBrowser, openFolder } from '../util/shell';
import {
  getWorldContainers,
  setWorldContainers,
} from '../core/world/worldContainer';
import { getDefaultSettings } from '../core/settings/settings';
import { getSystemSettings, setSystemSettings } from '../core/stores/system';

export const backListener: BackListener<API> = {
  on: {
    Command: runCommand,
    OpenBrowser: openBrowser,
    OpenFolder: openFolder,
  },
  handle: {
    RunServer: runServer,

    SaveWorldSettings: saveWorldSettings,

    GetSystemSettings: getSystemSettings,
    SetSystemSettings: setSystemSettings,

    GetDefaultSettings: getDefaultSettings,
    GetVersions: getVersions,
    GetWorldContainers: getWorldContainers,
    SetWorldContainers: setWorldContainers,
    GetWorldAbbrs: getWorldAbbrs,
    GetWorld: getWorld,
  },
};
