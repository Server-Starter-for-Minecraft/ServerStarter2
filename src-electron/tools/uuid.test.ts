import { genUUID } from './uuid';

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      expect(1).toBe(1);
      //for (let i =0; i<100; i++){
      //const uuid = genUUID();
      //console.log(uuid,typeof uuid);
      //}
    },
    { timeout: 2 ** 31 - 1 }
  );
});
