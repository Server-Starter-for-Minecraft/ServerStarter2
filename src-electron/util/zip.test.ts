import { zip } from './zip';

describe('example', async () => {
  test('example test 01', () => {
    const a = [1, 2, 3, 4, 5];
    const b = ['a', 'b', 'c', 'd'];

    const result = [
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
      [4, 'd'],
    ];

    expect(zip(a, b)).toEqual(result);

    expect(zip([], [])).toEqual([]);
  });
});
