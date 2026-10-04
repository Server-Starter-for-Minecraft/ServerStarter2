import { describe, expect, test } from 'vitest';
import { filterContents, toDisplayText } from './contentFilter';

const contents = [
  { name: 'Terralith_2.5.1', description: '§aOverworld§r generation' },
  { name: 'Incendium', description: 'Nether overhaul' },
  { name: 'NoDescriptionPack' },
];

describe('filterContents', () => {
  test('検索ワードが空の場合はすべての追加コンテンツを表示する', () => {
    expect(filterContents(contents, '  ')).toEqual(contents);
  });

  test('名前・説明のいずれかに大文字・小文字を区別せずに一致するものを表示する', () => {
    expect(filterContents(contents, 'terra').map((c) => c.name)).toEqual([
      'Terralith_2.5.1',
    ]);
    expect(filterContents(contents, 'NETHER').map((c) => c.name)).toEqual([
      'Incendium',
    ]);
  });

  test('説明の書式コードは検索の対象に含めない', () => {
    expect(filterContents(contents, 'overworld generation')).toHaveLength(1);
    expect(filterContents(contents, '§a')).toHaveLength(0);
  });

  test('スペース区切りの複数の検索ワードはすべてに一致するものを表示する', () => {
    expect(filterContents(contents, 'nether incendium')).toHaveLength(1);
    expect(filterContents(contents, 'nether terralith')).toHaveLength(0);
  });
});

describe('toDisplayText', () => {
  test('Minecraftの書式コードを取り除いて表示する', () => {
    expect(toDisplayText('§l§6Gold §rPack ')).toBe('Gold Pack');
  });
});
