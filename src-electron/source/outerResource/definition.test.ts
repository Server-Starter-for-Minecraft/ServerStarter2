import { assertOk } from 'app/test/util/assert';
import { describe, expect, test } from 'vitest';
import { isError } from 'app/src-electron/util/error/error';
import { resolveImageSource } from './definition';

const BASE = 'https://example.com/repo/serverstarter2';
const FILE = 'v1/donation.json';

/**
 * 画像の参照先の解決は，アプリの読み込みと同梱データの作成で同じ参照先を受け付けるための共通の規則
 */
describe('画像の参照先の解決', () => {
  test.each([
    ['icons/a.png', 'v1/icons/a.png'],
    ['./icons/a%23b.webp', 'v1/icons/a%23b.webp'],
    ['../shared/a.svg', 'shared/a.svg'],
    [`${BASE}/v1/icons/a.JPG`, 'v1/icons/a.JPG'],
    ['icons/a.png?v=1#x', 'v1/icons/a.png'],
  ])('配布元の中の画像 %s は配布元からのパス %s で参照する', (source, path) => {
    const resolved = resolveImageSource(source, BASE, FILE);
    assertOk(resolved);
    expect(resolved.pathInDistribution).toBe(path);
  });

  test('配布元の URL の表記が正規化されていなくても，配布元の中の画像として扱う', () => {
    const resolved = resolveImageSource(
      'icons/a.png',
      'https://EXAMPLE.com:443/repo/serverstarter2/',
      FILE
    );
    assertOk(resolved);
    expect(resolved.pathInDistribution).toBe('v1/icons/a.png');
  });

  test('配布元の外の https の画像は URL で参照する', () => {
    const resolved = resolveImageSource(
      'https://cdn.example.org/a.png',
      BASE,
      FILE
    );
    assertOk(resolved);
    expect(resolved.pathInDistribution).toBeUndefined();
    expect(resolved.url.href).toBe('https://cdn.example.org/a.png');
  });

  test('配布元の上の階層を指す相対パスは，配布元の中の画像として扱わない', () => {
    const resolved = resolveImageSource('../../../a.png', BASE, FILE);
    assertOk(resolved);
    expect(resolved.pathInDistribution).toBeUndefined();
  });

  test.each([
    'http://cdn.example.org/a.png',
    'file:///C:/a.png',
    'icons/a.gif',
    'icons/a',
  ])('受け付けない参照先 %s はエラーになる', (source) => {
    expect(isError(resolveImageSource(source, BASE, FILE))).toBe(true);
  });
});
