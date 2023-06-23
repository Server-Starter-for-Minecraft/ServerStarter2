import { searchPlayer } from './search';

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      // const serchkeys = [
      //   'txkodo',
      //   'civiltt',
      //   'test',
      //   '4566e69fc90748ee8d71d7ba5aa00d20',
      //   '4566e69f-c907-48ee-8d71-d7ba5aa00d20',
      //   '00000000-0000-0000-0000-000000000000',
      //   'adsssssssssssawidowaiowajwioajdoiaw',
      //   'nnaplayerinaiyo',
      // ];
      // for (const key of serchkeys) {
      //   const result = await searchPlayer(key);
      //   console.log(result);
      // }
      expect(1).toBe(1);
    },
    { timeout: 2 ** 31 - 1 }
  );
});
