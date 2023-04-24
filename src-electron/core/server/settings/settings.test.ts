import { getDefaultSettings } from './settings';

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      console.log(await getDefaultSettings());
      expect(1).toBe(1);
    },
    { timeout: 2 ** 31 - 1 }
  );
});
