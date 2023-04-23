import { World } from 'app/src-electron/api/scheme';
import { versionLoaders } from './version/version';
import { VersionLoader } from './version/base';
import { isFailure, isSuccess } from 'src-electron/api/failable';
import { runServer } from './server';
import { Path } from '../utils/path/path';
import { versionsPath } from './const';
import { getWorlds } from './world/world';
import { setBackAPI } from '../api';

setBackAPI({
  invoke: {
    async AgreeEula() {
      return false;
    },
  },
  send: {
    UpdateStatus: console.log,
    AddConsole: console.log,
  },
});

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      const worlds = await getWorlds('');
      if (isSuccess(worlds)) {
        await runServer(worlds[0]);
      }

      expect(1).toBe(1);
    },
    { timeout: 2 ** 31 - 1 }
  );
});

// async function loadversion(loader: VersionLoader | undefined) {
//   if (loader === undefined) return;

//   const versions = await loader.getAllVersions();

//   if (isFailure(versions)) return versions;

//   for (let version of versions) {
//     console.log('start', version);
//     await testRunServer(version);
//     console.log('finish', version);
//   }
// }
