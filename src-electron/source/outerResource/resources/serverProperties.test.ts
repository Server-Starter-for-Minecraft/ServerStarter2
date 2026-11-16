import { describe, expect, test } from 'vitest';
import { DefaultServerPropertiesAnnotation } from 'app/src-electron/schema/serverproperty';
import {
  getStablePropertyType,
  mergeServerPropertyDefinitions,
  serverPropertiesDefinition,
} from './serverProperties';

describe('同梱と外部リソースのサーバープロパティの定義の統合', () => {
  test('外部リソースがなくても，アプリ内のすべてのプロパティの定義がある', () => {
    const merged = mergeServerPropertyDefinitions({});
    for (const [key, annotation] of Object.entries(
      DefaultServerPropertiesAnnotation
    )) {
      expect(merged[key]?.definitions).toEqual([annotation]);
    }
  });

  test('外部リソースのプロパティを追加し，同梱のプロパティの定義を上書きする', () => {
    const merged = mergeServerPropertyDefinitions({
      'brand-new': { definitions: [{ type: 'boolean', default: true }] },
      difficulty: {
        description: { ja: '難易度' },
        definitions: [{ type: 'string', default: 'normal' }],
      },
    });
    expect(merged['brand-new'].definitions[0].default).toBe(true);
    expect(merged.difficulty.definitions[0].default).toBe('normal');
    expect(merged.difficulty.description).toEqual({ ja: '難易度' });
    // 外部リソースに無い同梱のプロパティは残る
    expect(merged['white-list']).toBeDefined();
  });

  test('同梱のプロパティと型が異なる定義は使わない', () => {
    const merged = mergeServerPropertyDefinitions({
      'white-list': {
        description: { ja: '説明' },
        definitions: [{ type: 'string', default: 'yes' }],
      },
    });
    expect(merged['white-list'].definitions).toEqual([
      DefaultServerPropertiesAnnotation['white-list'],
    ]);
    // 型以外の情報（説明文など）は使う
    expect(merged['white-list'].description).toEqual({ ja: '説明' });
  });

  test('不正な定義だけを除いて読み込み，定義が残らないプロパティは読み込まない', () => {
    const parsed = serverPropertiesDefinition.parser.safeParse({
      properties: {
        ok: {
          definitions: [
            { type: 'number', default: 1 },
            { type: 'number', default: 'not number' },
          ],
        },
        broken: { definitions: [{ type: 'unknown' }] },
      },
    });
    expect(parsed.success && parsed.data.properties).toEqual({
      ok: { definitions: [{ type: 'number', default: 1 }] },
    });
  });
});

describe('タブの一覧の読み込み', () => {
  test('識別子が重複したタブは最初のものだけを読み込む', () => {
    const parsed = serverPropertiesDefinition.parser.safeParse({
      groups: [
        { id: 'a', label: { ja: '1' } },
        { id: 'a', label: { ja: '2' } },
      ],
      properties: {},
    });
    expect(parsed.success && parsed.data.groups).toEqual([
      { id: 'a', label: { ja: '1' } },
    ]);
  });
});

describe('バージョンによらないプロパティの型', () => {
  test('すべての定義の型が同じ場合はその型を返す', () => {
    expect(
      getStablePropertyType({
        definitions: [
          { type: 'number', default: 1, minecraftVersion: { to: '1.20' } },
          { type: 'number', default: 2, minecraftVersion: { from: '1.21' } },
        ],
      })
    ).toBe('number');
  });

  test('バージョンによって型が異なる場合は返さない', () => {
    expect(
      getStablePropertyType({
        definitions: [
          { type: 'number', default: 1 },
          { type: 'string', default: 'a' },
        ],
      })
    ).toBeUndefined();
  });
});
