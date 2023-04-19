import { versionsPath } from '../const';
import { readyVanillaVersion } from './vanilla';

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
    },
    { timeout: 10000 }
  );
});
