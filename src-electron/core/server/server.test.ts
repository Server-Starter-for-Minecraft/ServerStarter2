import { World } from 'app/src-electron/api/scheme';
import { versionLoaders } from './version/version';
import { VersionLoader } from './version/interface';
import { isFailure } from 'src-electron/api/failable';
import { runServer, testRunServer } from './server';
import { Path } from '../utils/path/path';
import { versionsPath } from './const';

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      for (let loader of Object.values(versionLoaders)) {
        await loadversion(loader);
      }
      expect(1).toBe(1);
    },
    { timeout: 2 ** 31 - 1 }
  );
});

async function loadversion(loader: VersionLoader | undefined) {
  if (loader === undefined) return;

  const versions = await loader.getAllVersions();

  if (isFailure(versions)) return versions;

  for (let version of versions) {
    console.log('start', version);
    await testRunServer(version);
    console.log('finish', version);
  }
}
