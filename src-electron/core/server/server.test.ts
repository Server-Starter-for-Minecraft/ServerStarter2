import { World } from 'app/src-electron/api/scheme';
import { runServer } from './server';

const world: World = {
  name: 'test',
  settings: {
    version: {
      id: '1.19.2',
      release: true,
      type: 'vanilla',
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
      // const result = await runServer(world);
      // console.log(result);
      expect(1).toBe(1);
    },
    { timeout: 2 ** 31 - 1 }
  );
});
