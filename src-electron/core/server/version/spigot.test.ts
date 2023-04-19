import { versionsPath } from '../const';
import { readySpigotVersion } from './spigot';

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      const result = await readySpigotVersion(
        versionsPath.child('vanilla'),
        versionsPath.child('spigot'),
        {
          type: 'spigot',
          id: '1.19.4',
          release: true,
        }
      );
      console.log(result, 100);
    },
    { timeout: 2 ** 31 - 1 }
  );
});
