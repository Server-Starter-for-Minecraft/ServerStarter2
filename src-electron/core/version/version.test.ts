import { Path } from '../../util/path';
import { Failable, isValid, isError } from '../../util/error/failable';
import { forgeVersionLoader } from './forge';
import { JavaComponent, vanillaVersionLoader } from './vanilla';
import { spigotVersionLoader } from './spigot';
import { mohistmcVersionLoader } from './mohistmc';
import { versionLoaders } from './version';
import { VersionLoader } from './base';

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      // const result = await readyVanillaVersion(versionsPath.child('vanilla'), {
      //   type: 'vanilla',
      //   id: '1.19.2',
      //   release: true,
      // });
      // console.log(result, 100);
      // const promisses: Promise<
      //   Failable<{
      //     programArguments: string[];
      //     serverCwdPath: Path;
      //     component: JavaComponent;
      //   }>
      // >[] = [];
      // ids.forEach((id) =>
      //   promisses.push(
      //     forgeVersionLoader.readyVersion({ release: true, type: 'forge', id })
      //   )
      // );

      // (await Promise.all(promisses)).forEach((x) => console.log(x));

      // await Promise.all(
      //   Object.values(versionLoaders).map((loader) =>
      //     loader.getAllVersions(true)
      //   )
      // );

      // await versionLoaders.spigot?.readyVersion({
      //   type: 'spigot',
      //   id: '1.16.4',
      //   release: true,
      // });

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
//     const result = await loader.readyVersion(version);
//     console.log(result, version);
//   }
// }
