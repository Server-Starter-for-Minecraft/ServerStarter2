import { describe, expect, test } from 'vitest';
import { enAdditionalContents } from '../../../i18n/en-US/Pages/World/additionalContents';
import { jaAdditionalContents } from '../../../i18n/ja/Pages/World/additionalContents';
import { ContentType } from './contentActions';
import { ContentPickOption, getImportActions } from './contentImport';

const ALL_TYPES: ContentType[] = ['datapack', 'plugin', 'mod'];

/** ダイアログのオプションから、ファイル・フォルダーのどちらを選ぶ操作かを返す */
const pickSource = (o: ContentPickOption) =>
  'isFile' in o && !o.isFile ? 'folder' : 'file';

/** 指定した種別で、ファイル・フォルダーのどちらから導入できるかを返す */
const importSources = (type: ContentType) =>
  getImportActions(type)
    .map((a) => pickSource(a.pickOption))
    .sort();

describe('getImportActions', () => {
  test('データパックはファイル（zip）とフォルダーのどちらからも導入できる', () => {
    expect(importSources('datapack')).toEqual(['file', 'folder']);
  });

  test.each<ContentType>(['plugin', 'mod'])(
    '%s はファイルからのみ導入できる',
    (type) => {
      expect(importSources(type)).toEqual(['file']);
    }
  );

  test.each(ALL_TYPES)('%s の導入ダイアログは表示中の種別を開く', (type) => {
    for (const action of getImportActions(type)) {
      expect(action.pickOption.type).toBe(type);
    }
  });

  test.each(ALL_TYPES)(
    '%s の各導入ボタンの表示名が日本語・英語の両方で定義されている',
    (type) => {
      for (const { labelKey } of getImportActions(type)) {
        const key = labelKey.replace('additionalContents.', '');
        expect(jaAdditionalContents).toHaveProperty(key);
        expect(enAdditionalContents).toHaveProperty(key);
      }
    }
  );

  test.each(ALL_TYPES)(
    '%s の各導入ボタンは一覧描画用のキーが重複しない',
    (type) => {
      const keys = getImportActions(type).map((a) => a.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  );
});
