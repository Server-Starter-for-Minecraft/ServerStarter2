import { API } from 'app/src-electron/api/api';
import { BackListener } from 'app/src-electron/core/ipc/link';
import { runCommand, runServer } from '../server/server';
import { getVersions } from '../server/version/version';
import { getAllWorlds } from '../server/world/world';

export const backListener: BackListener<API> = {
  on: {
    Command: runCommand,
  },
  handle: {
    RunServer: runServer,
    GetVersions: getVersions,
    GetAllWorlds: getAllWorlds,
  },
};
