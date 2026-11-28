import { describe, expect, test } from 'vitest';
import { getOwn } from './obj';

describe('getOwn', () => {
  test('オブジェクト自身が持つキーの値を返す', () => {
    expect(getOwn({ a: 1 }, 'a')).toBe(1);
  });

  test('持たないキーは undefined を返す', () => {
    expect(getOwn<number>({ a: 1 }, 'b')).toBeUndefined();
  });

  test.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    '継承したキー %s の値（Object.prototype の関数など）は返さない',
    (key) => {
      expect(getOwn<number>({ a: 1 }, key)).toBeUndefined();
    }
  );

  test('継承したキーと同名のキーを自身が持つ場合は，その値を返す', () => {
    const object = Object.fromEntries([['constructor', 'own']]);
    expect(getOwn(object, 'constructor')).toBe('own');
  });
});
