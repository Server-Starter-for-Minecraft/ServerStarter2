import { newWorld } from '../core/world/world';

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      console.log(await newWorld());
      expect(1).toBe(1);
    },
    { timeout: 2 ** 31 - 1 }
  );
});
