import { getDefaultWorld } from '../core/world/world';

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      console.log(await getDefaultWorld());
      expect(1).toBe(1);
    },
    { timeout: 2 ** 31 - 1 }
  );
});
