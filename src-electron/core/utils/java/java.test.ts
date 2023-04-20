import { runtimePath } from '../../server/const.js';
import { readyJava } from './java.js';

describe('readyJava', async () => {
  test(
    '',
    async () => {
      expect(1).toBe(1);
    },
    { timeout: 10000 }
  );
});
