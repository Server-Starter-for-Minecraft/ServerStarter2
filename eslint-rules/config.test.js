import { describe, expect, test } from 'vitest';
import { restrictedPackagePattern } from './config.js';

describe('restrictedPackagePattern', () => {
  const pattern = new RegExp(restrictedPackagePattern(['zod', 'dayjs/*']));

  test('許可していない外部パッケージに一致する', () => {
    expect(pattern.test('cheerio')).toBe(true);
    expect(pattern.test('@ngrok/ngrok')).toBe(true);
    expect(pattern.test('fs-extra')).toBe(true);
  });

  test('許可したパッケージ・その配下のモジュールには一致しない', () => {
    expect(pattern.test('zod')).toBe(false);
    expect(pattern.test('dayjs')).toBe(false);
    expect(pattern.test('dayjs/esm')).toBe(false);
  });

  test('パッケージ名の一部が一致するだけの別のパッケージには一致する', () => {
    expect(pattern.test('zod-extra')).toBe(true);
  });

  test('相対パス・プロジェクト内のエイリアスには一致しない', () => {
    expect(pattern.test('./local')).toBe(false);
    expect(pattern.test('../util/binary/path')).toBe(false);
    expect(pattern.test('app/src-electron/util/binary/path')).toBe(false);
    expect(pattern.test('src-electron/schema/brands')).toBe(false);
    expect(pattern.test('src/error/error')).toBe(false);
  });
});
