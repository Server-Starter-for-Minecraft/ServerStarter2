import { describe, expect, test } from 'vitest';
import { isNewerVersion } from './semver';

describe('isNewerVersion', () => {
  test.each([
    ['v2.2.1', '2.2.0'],
    ['v2.3.0', '2.2.9'],
    ['v3.0.0', '2.10.10'],
    ['v2.10.0', '2.9.0'],
  ])('%sは%sより新しい', (target, current) => {
    expect(isNewerVersion(target, current)).toBe(true);
  });

  test.each([
    ['v2.2.0', '2.2.0'],
    ['v2.1.5', '2.2.0'],
    ['v1.99.99', '2.0.0'],
  ])('%sは%sより新しくない', (target, current) => {
    expect(isNewerVersion(target, current)).toBe(false);
  });

  test('接頭辞vの有無にかかわらず比較できる', () => {
    expect(isNewerVersion('2.2.1', 'v2.2.0')).toBe(true);
  });

  test.each([['latest'], ['v2.2'], ['v2.2.1-beta']])(
    '解釈できないバージョン（%s）は新しいとみなさない',
    (target) => {
      expect(isNewerVersion(target, '2.2.0')).toBe(false);
    }
  );
});
