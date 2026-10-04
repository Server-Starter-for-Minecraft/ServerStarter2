import { describe, expect, test } from 'vitest';
import { mergeReloadedContents } from './contentReload';

/** テスト用の追加コンテンツ */
const pack = (name: string, type = 'world') => ({ name, ext: '.zip', type });

describe('mergeReloadedContents', () => {
  test('保存先の内容が表示中の一覧と同じ場合は変化なしとして、表示中の一覧をそのまま使う', () => {
    const current = [pack('A'), pack('B')];
    const result = mergeReloadedContents(current, [pack('B'), pack('A')]);

    expect(result.changed).toBe(false);
    expect(result.contents).toBe(current);
  });

  test('保存先に直接追加された追加コンテンツを反映する', () => {
    const result = mergeReloadedContents([pack('A')], [pack('A'), pack('New')]);

    expect(result.changed).toBe(true);
    expect(result.contents.map((c) => c.name)).toEqual(['A', 'New']);
  });

  test('保存先から直接削除された追加コンテンツを一覧から除く', () => {
    const result = mergeReloadedContents([pack('A'), pack('B')], [pack('A')]);

    expect(result.changed).toBe(true);
    expect(result.contents.map((c) => c.name)).toEqual(['A']);
  });

  test('導入した直後でまだ保存先にコピーされていない追加コンテンツは残す', () => {
    const result = mergeReloadedContents(
      [pack('A'), pack('Installing', 'system')],
      [pack('A')]
    );

    expect(result.contents.map((c) => c.name)).toEqual(['A', 'Installing']);
    expect(result.changed).toBe(false);
  });
});
