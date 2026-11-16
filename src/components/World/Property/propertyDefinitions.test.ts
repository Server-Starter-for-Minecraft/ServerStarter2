import { describe, expect, test } from 'vitest';
import type {
  ServerPropertyDefinitions,
  ServerPropertyEntryV1,
} from 'app/src-electron/schema/outerResource/serverProperties';
import { propertyClasses } from './classifications';
import {
  getGroupProperties,
  getPropertyAnnotation,
  getPropertyDescription,
  isClassifiedProperty,
  isRemovedProperty,
  selectPropertyDefinition,
} from './propertyDefinitions';

/** 新しい順に並べたバージョン一覧（バニラの配布一覧と同じ並び） */
const order = ['1.21', '1.20.1', '1.20', '1.19', '1.18.2', '1.18'];

/** 1.19 で選択肢の表記が変わったプロパティ（level-type と同じ変化） */
const levelType: ServerPropertyEntryV1 = {
  definitions: [
    {
      type: 'string',
      default: 'minecraft:normal',
      enum: ['minecraft:normal', 'minecraft:flat'],
      minecraftVersion: { from: '1.19' },
    },
    {
      type: 'string',
      default: 'DEFAULT',
      enum: ['DEFAULT', 'FLAT'],
      minecraftVersion: { to: '1.18.2' },
    },
  ],
};

const defaultOf = (entry: ServerPropertyEntryV1, version: string | undefined) =>
  selectPropertyDefinition(entry, version, order).default;

describe('ワールドのバージョンに合うプロパティの定義の選択', () => {
  test('バージョンの範囲に合う定義を使う（範囲の両端を含む）', () => {
    expect(defaultOf(levelType, '1.21')).toBe('minecraft:normal');
    expect(defaultOf(levelType, '1.19')).toBe('minecraft:normal');
    expect(defaultOf(levelType, '1.18.2')).toBe('DEFAULT');
    expect(defaultOf(levelType, '1.18')).toBe('DEFAULT');
  });

  test('アプリが知らない新しいバージョンでも定義を使う（最新の定義）', () => {
    expect(defaultOf(levelType, '99.0')).toBe('minecraft:normal');
  });

  test('対応が追いついていない新しいバージョンでは，直前の定義を使い続ける', () => {
    const entry: ServerPropertyEntryV1 = {
      definitions: [
        { type: 'number', default: 1, minecraftVersion: { to: '1.20' } },
      ],
    };
    expect(defaultOf(entry, '1.21')).toBe(1);
  });

  test('範囲の間のバージョンでは直前の定義を使う', () => {
    const entry: ServerPropertyEntryV1 = {
      definitions: [
        { type: 'number', default: 2, minecraftVersion: { from: '1.21' } },
        { type: 'number', default: 1, minecraftVersion: { to: '1.19' } },
      ],
    };
    expect(defaultOf(entry, '1.20.1')).toBe(1);
  });

  test('すべての範囲より古いバージョンでは最も古い定義を使う', () => {
    const entry: ServerPropertyEntryV1 = {
      definitions: [
        { type: 'number', default: 2, minecraftVersion: { from: '1.21' } },
        { type: 'number', default: 1, minecraftVersion: { from: '1.20' } },
      ],
    };
    expect(defaultOf(entry, '1.18')).toBe(1);
  });

  test('ワールドに依らない場合は最新の定義を使う', () => {
    expect(defaultOf(levelType, undefined)).toBe('minecraft:normal');
  });
});

describe('プロパティ画面で使う注釈', () => {
  test('定義のないプロパティは自由入力の文字列として扱う', () => {
    expect(getPropertyAnnotation({}, 'brand-new', '1.21', order)).toEqual({
      type: 'string',
      default: '',
    });
  });

  test('バージョンに合う定義の型・既定値・選択肢を返す', () => {
    expect(
      getPropertyAnnotation(
        { 'level-type': levelType },
        'level-type',
        '1.18',
        order
      )
    ).toEqual({
      type: 'string',
      default: 'DEFAULT',
      enum: ['DEFAULT', 'FLAT'],
    });
  });
});

describe('廃止されたプロパティ', () => {
  const entry: ServerPropertyEntryV1 = {
    removedIn: '1.20',
    definitions: [{ type: 'boolean', default: true }],
  };

  test('廃止されたバージョン以降で廃止とみなす', () => {
    expect(isRemovedProperty(entry, '1.20', order)).toBe(true);
    expect(isRemovedProperty(entry, '1.21', order)).toBe(true);
    expect(isRemovedProperty(entry, '1.19', order)).toBe(false);
  });

  test('廃止の指定がない場合やワールドに依らない場合は廃止とみなさない', () => {
    expect(isRemovedProperty(levelType, '1.21', order)).toBe(false);
    expect(isRemovedProperty(entry, undefined, order)).toBe(false);
  });
});

describe('タブの分類', () => {
  const [classified] = propertyClasses.security;

  test('外部リソースで指定のないプロパティはアプリ内の分類に従う', () => {
    expect(getGroupProperties({}, 'security')).toEqual(
      propertyClasses.security
    );
  });

  test('外部リソースで指定したタブに表示する', () => {
    const definitions: ServerPropertyDefinitions = {
      'brand-new': {
        groups: ['security'],
        definitions: [{ type: 'boolean', default: false }],
      },
      [classified]: {
        groups: ['network'],
        definitions: [{ type: 'boolean', default: false }],
      },
    };
    expect(getGroupProperties(definitions, 'security')).toEqual([
      ...propertyClasses.security.filter((k) => k !== classified),
      'brand-new',
    ]);
    expect(getGroupProperties(definitions, 'network')).toContain(classified);
    expect(isClassifiedProperty(definitions, 'brand-new')).toBe(true);
  });

  test('アプリが知らないタブだけが指定されたプロパティは「その他」に表示する', () => {
    const definitions: ServerPropertyDefinitions = {
      'brand-new': {
        groups: ['unknown-tab'],
        definitions: [{ type: 'boolean', default: false }],
      },
    };
    expect(isClassifiedProperty(definitions, 'brand-new')).toBe(false);
  });
});

describe('プロパティの説明文', () => {
  const builtIn = (key: string) => (key === 'known' ? 'アプリ内' : undefined);

  test('外部リソースの説明文を優先する', () => {
    const definitions: ServerPropertyDefinitions = {
      known: {
        description: { ja: '外部', 'en-US': 'remote' },
        definitions: [{ type: 'string', default: '' }],
      },
    };
    expect(getPropertyDescription(definitions, 'known', 'en-US', builtIn)).toBe(
      'remote'
    );
  });

  test('外部リソースに説明文がなければアプリ内の説明文を使う', () => {
    expect(getPropertyDescription({}, 'known', 'ja', builtIn)).toBe('アプリ内');
    expect(getPropertyDescription({}, 'other', 'ja', builtIn)).toBeUndefined();
  });
});
