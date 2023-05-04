import { API } from 'src-electron/api/api';
import { BackListener } from 'src-electron/ipc/link';
import {
  runCommand,
  runServer,
  getAllWorlds,
  getVersions,
} from '../core/server/dummyServer';

export const backListener: BackListener<API> = {
  on: {
    Command: runCommand,
  },
  handle: {
    RunServer: runServer,
    GetAllWorlds: getAllWorlds,
    GetVersions: getVersions,
  },
};
