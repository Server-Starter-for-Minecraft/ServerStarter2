import { testWorldSettingsFixer } from 'src-electron/core/settings/worldJson';
import {
  arrayFixer,
  booleanFixer,
  FAIL,
  literalFixer,
  nullFixer,
  numberFixer,
  objectFixer,
  stringFixer,
  unionFixer,
} from './fixer';

describe('dataFixer', async () => {
  test('literalFixer without Default', () => {
    const fixer = literalFixer(['', 'a', 0, 1, true, false, null]);
    expect(fixer('')).toBe('');
    expect(fixer('a')).toBe('a');
    expect(fixer(0)).toBe(0);
    expect(fixer(1)).toBe(1);
    expect(fixer(true)).toBe(true);
    expect(fixer(false)).toBe(false);
    expect(fixer(null)).toBe(null);
    expect(fixer([])).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);

    expect(fixer('b')).toBe(FAIL);
  });
  test('literalFixer with Default', () => {
    const fixer = literalFixer(['', 'a', 0, 1, true, false, null], '');
    expect(fixer('')).toBe('');
    expect(fixer('a')).toBe('a');
    expect(fixer(0)).toBe(0);
    expect(fixer(1)).toBe(1);
    expect(fixer(true)).toBe(true);
    expect(fixer(false)).toBe(false);
    expect(fixer(null)).toBe(null);
    expect(fixer([])).toBe('');
    expect(fixer({})).toBe('');

    expect(fixer('b')).toBe('');
  });
  test('stringFixer without Default', () => {
    const fixer = stringFixer();
    expect(fixer('a')).toBe('a');
    expect(fixer('')).toBe('');
    expect(fixer(0)).toBe(FAIL);
    expect(fixer(1)).toBe(FAIL);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer([])).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);
  });
  test('stringFixer with Default', () => {
    const fixer = stringFixer('A');
    expect(fixer('a')).toBe('a');
    expect(fixer('')).toBe('');
    expect(fixer(0)).toBe('A');
    expect(fixer(1)).toBe('A');
    expect(fixer(true)).toBe('A');
    expect(fixer(false)).toBe('A');
    expect(fixer(null)).toBe('A');
    expect(fixer([])).toBe('A');
    expect(fixer({})).toBe('A');
  });
  test('numberFixer without Default', () => {
    const fixer = numberFixer();
    expect(fixer('')).toBe(FAIL);
    expect(fixer('a')).toBe(FAIL);
    expect(fixer(0)).toBe(0);
    expect(fixer(1)).toBe(1);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer([])).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);
  });
  test('numberFixer with Default', () => {
    const fixer = numberFixer(-1);
    expect(fixer('')).toBe(-1);
    expect(fixer('a')).toBe(-1);
    expect(fixer(0)).toBe(0);
    expect(fixer(1)).toBe(1);
    expect(fixer(true)).toBe(-1);
    expect(fixer(false)).toBe(-1);
    expect(fixer(null)).toBe(-1);
    expect(fixer([])).toBe(-1);
    expect(fixer({})).toBe(-1);
  });
  test('booleanFixer without Default', () => {
    const fixer = booleanFixer();
    expect(fixer('')).toBe(FAIL);
    expect(fixer('a')).toBe(FAIL);
    expect(fixer(0)).toBe(FAIL);
    expect(fixer(1)).toBe(FAIL);
    expect(fixer(true)).toBe(true);
    expect(fixer(false)).toBe(false);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer([])).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);
  });
  test('booleanFixer with Default', () => {
    const fixer = booleanFixer(false);
    expect(fixer('')).toBe(false);
    expect(fixer('a')).toBe(false);
    expect(fixer(0)).toBe(false);
    expect(fixer(1)).toBe(false);
    expect(fixer(true)).toBe(true);
    expect(fixer(false)).toBe(false);
    expect(fixer(null)).toBe(false);
    expect(fixer([])).toBe(false);
    expect(fixer({})).toBe(false);
  });
  test('nullFixer without Default', () => {
    const fixer = nullFixer();
    expect(fixer('')).toBe(FAIL);
    expect(fixer('a')).toBe(FAIL);
    expect(fixer(0)).toBe(FAIL);
    expect(fixer(1)).toBe(FAIL);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(null);
    expect(fixer([])).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);
  });
  test('nullFixer with Default', () => {
    const fixer = nullFixer(null);
    expect(fixer('')).toBe(null);
    expect(fixer('a')).toBe(null);
    expect(fixer(0)).toBe(null);
    expect(fixer(1)).toBe(null);
    expect(fixer(true)).toBe(null);
    expect(fixer(false)).toBe(null);
    expect(fixer(null)).toBe(null);
    expect(fixer([])).toBe(null);
    expect(fixer({})).toBe(null);
  });
  test('objectFixer fix only Object without default', () => {
    const fixer = objectFixer(
      {
        a: stringFixer(),
        b: numberFixer(),
      },
      false
    );
    expect(fixer('')).toBe(FAIL);
    expect(fixer('a')).toBe(FAIL);
    expect(fixer(0)).toBe(FAIL);
    expect(fixer(1)).toBe(FAIL);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer([])).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);

    expect(fixer({ a: '', b: 0 })).toEqual({ a: '', b: 0 });
    expect(fixer({ a: 0, b: 0 })).toBe(FAIL);
    expect(fixer({ b: 0 })).toBe(FAIL);
  });
  test('objectFixer fix only Object with default', () => {
    const fixer = objectFixer(
      {
        a: stringFixer('default'),
        b: numberFixer(-1),
      },
      false
    );
    expect(fixer('')).toBe(FAIL);
    expect(fixer('a')).toBe(FAIL);
    expect(fixer(0)).toBe(FAIL);
    expect(fixer(1)).toBe(FAIL);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer([])).toBe(FAIL);
    expect(fixer({})).toEqual({ a: 'default', b: -1 });

    expect(fixer({ a: '', b: 0 })).toEqual({ a: '', b: 0 });
    expect(fixer({ a: 0, b: 0 })).toEqual({ a: 'default', b: 0 });
    expect(fixer({ b: 0 })).toEqual({ a: 'default', b: 0 });
  });
  test('objectFixer fix any with default', () => {
    const fixer = objectFixer(
      {
        a: stringFixer('default'),
        b: numberFixer(-1),
      },
      true
    );
    expect(fixer('')).toEqual({ a: 'default', b: -1 });
    expect(fixer('a')).toEqual({ a: 'default', b: -1 });
    expect(fixer(0)).toEqual({ a: 'default', b: -1 });
    expect(fixer(1)).toEqual({ a: 'default', b: -1 });
    expect(fixer(true)).toEqual({ a: 'default', b: -1 });
    expect(fixer(false)).toEqual({ a: 'default', b: -1 });
    expect(fixer(null)).toEqual({ a: 'default', b: -1 });
    expect(fixer([])).toEqual({ a: 'default', b: -1 });
    expect(fixer({})).toEqual({ a: 'default', b: -1 });

    expect(fixer({ a: '', b: 0 })).toEqual({ a: '', b: 0 });
    expect(fixer({ a: 0, b: 0 })).toEqual({ a: 'default', b: 0 });
    expect(fixer({ b: 0 })).toEqual({ a: 'default', b: 0 });
  });
  test('arrayFixer fix only Array without default', () => {
    const fixer = arrayFixer(stringFixer(), false);
    expect(fixer('')).toBe(FAIL);
    expect(fixer('a')).toBe(FAIL);
    expect(fixer(0)).toBe(FAIL);
    expect(fixer(1)).toBe(FAIL);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);

    expect(fixer([])).toEqual([]);

    expect(fixer([1])).toEqual([]);
    expect(fixer(['hello'])).toEqual(['hello']);
  });
  test('arrayFixer fix only Array with default', () => {
    const fixer = arrayFixer(stringFixer('default'), false);
    expect(fixer('')).toBe(FAIL);
    expect(fixer('a')).toBe(FAIL);
    expect(fixer(0)).toBe(FAIL);
    expect(fixer(1)).toBe(FAIL);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);

    expect(fixer([])).toEqual([]);

    expect(fixer([1])).toEqual(['default']);
    expect(fixer(['hello'])).toEqual(['hello']);
  });
  test('arrayFixer fix any with default', () => {
    const fixer = arrayFixer(stringFixer('default'), true);
    expect(fixer('')).toEqual([]);
    expect(fixer('a')).toEqual([]);
    expect(fixer(0)).toEqual([]);
    expect(fixer(1)).toEqual([]);
    expect(fixer(true)).toEqual([]);
    expect(fixer(false)).toEqual([]);
    expect(fixer(null)).toEqual([]);
    expect(fixer({})).toEqual([]);

    expect(fixer([])).toEqual([]);

    expect(fixer([1])).toEqual(['default']);
    expect(fixer(['hello'])).toEqual(['hello']);
  });
  test('unionFixer(string without default|number without default)', () => {
    const fixer = unionFixer(stringFixer(), numberFixer());
    expect(fixer('')).toBe('');
    expect(fixer('a')).toBe('a');
    expect(fixer(0)).toBe(0);
    expect(fixer(1)).toBe(1);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);
    expect(fixer([])).toBe(FAIL);
  });
  test('unionFixer(string without default|number with default)', () => {
    const fixer = unionFixer(stringFixer(), numberFixer(-1));
    expect(fixer('')).toBe('');
    expect(fixer('a')).toBe('a');
    expect(fixer(0)).toBe(0);
    expect(fixer(1)).toBe(1);
    expect(fixer(true)).toBe(-1);
    expect(fixer(false)).toBe(-1);
    expect(fixer(null)).toBe(-1);
    expect(fixer({})).toBe(-1);
    expect(fixer([])).toBe(-1);
  });
  test('unionFixer(string with default|number without default)', () => {
    const fixer = unionFixer(stringFixer('default'), numberFixer());
    expect(fixer('')).toBe('');
    expect(fixer('a')).toBe('a');
    expect(fixer(0)).toBe('default');
    expect(fixer(1)).toBe('default');
    expect(fixer(true)).toBe('default');
    expect(fixer(false)).toBe('default');
    expect(fixer(null)).toBe('default');
    expect(fixer({})).toBe('default');
    expect(fixer([])).toBe('default');
  });
  test('world fixer test', () => {
    const fixer = testWorldSettingsFixer();
    expect(fixer('')).toBe(FAIL);
    expect(fixer('a')).toBe(FAIL);
    expect(fixer(0)).toBe(FAIL);
    expect(fixer(1)).toBe(FAIL);
    expect(fixer(true)).toBe(FAIL);
    expect(fixer(false)).toBe(FAIL);
    expect(fixer(null)).toBe(FAIL);
    expect(fixer({})).toBe(FAIL);
    expect(fixer([])).toBe(FAIL);

    // console.log('HELLOWORLD');
    // const r = fixer({
    //   version: { id: '23w18a', type: 'vanilla', release: true },
    //   last_date: 1683220681091,
    //   using: false,
    //   authority: {
    //     groups: [
    //       {
    //         uuid: '1',
    //         name: 'G',
    //         op: { level: 1, bypassesPlayerLimit: false },
    //         whitelist: true,
    //       },
    //     ],
    //     players: [],
    //     removed: [],
    //   },
    //   properties: {},
    // });
    // console.log(JSON.stringify(r));
  });
});
