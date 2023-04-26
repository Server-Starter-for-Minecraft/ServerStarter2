import { World } from 'src-electron/api/schema';
import { versionLoaders } from './version/version';
import { VersionLoader } from './version/base';
import { isFailure, isSuccess } from 'src-electron/api/failable';
import { runServer } from './server';
import { Path } from '../utils/path/path';
import { versionsCachePath } from './const';
import { getWorldAbbrs } from './world/world';
import { setBackAPI } from '../api';
import { userDataPath } from '../userDataPath';

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

const demoWorld: World = {
  name: 'papermc19',
  container: userDataPath.child('servers').str(),
  settings: {
    avater_path: 'https://cdn.quasar.dev/img/parallax2.jpg',
    version: {
      type: 'papermc',
      build: 178,
      id: '1.19.2',
    },
  },
  datapacks: [],
  plugins: [],
  mods: [],
};

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      // console.log(await runServer(demoWorld));

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
