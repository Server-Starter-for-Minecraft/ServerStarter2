import { describe, expect, test } from 'vitest';
import { removeContent } from './contentList';

/** テスト用の追加コンテンツ */
const pack = (name: string, ext = '.zip') => ({ name, ext });

describe('removeContent', () => {
  test('同じ名前のフォルダーとファイルがある場合は、指定した方のみを取り除く', () => {
    const folder = { name: 'foo', ext: '', type: 'world' };
    const file = { name: 'foo', ext: '.zip', type: 'world' };
    const list = [folder, file];

    removeContent(list, { ...file });

    expect(list).toEqual([folder]);
  });

  test('一覧に無い追加コンテンツを指定した場合は何も取り除かない', () => {
    const list = [pack('A'), pack('B')];

    removeContent(list, pack('C'));

    expect(list.map((c) => c.name)).toEqual(['A', 'B']);
  });
});
