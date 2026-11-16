import { describe, expect, test } from 'vitest';
import type {
  ServerPropertiesResource,
  ServerPropertyEntryV1,
} from 'app/src-electron/schema/outerResource/serverProperties';
import { builtInGroupKeys, propertyClasses } from './classifications';
import {
  getGroupProperties,
  getPropertyAnnotation,
  getPropertyDescription,
  getPropertyGroups,
  isNotYetIntroduced,
  OTHER_GROUP_ID,
  selectPropertyDefinition,
} from './propertyDefinitions';

/** 新しい順に並べたバージョン一覧（バニラの配布一覧と同じ並び） */
const order = ['1.21', '1.20.1', '1.20', '1.19', '1.18.2', '1.18'];

/** 1.19 で選択肢の表記が変わったプロパティ（説明用の例） */
const levelType: ServerPropertyEntryV1 = {
  definitions: [
    {
      type: 'string',
      default: 'DEFAULT',
      enum: ['DEFAULT', 'FLAT'],
      minecraftVersion: { to: '1.18.2' },
    },
    {
      type: 'string',
      default: 'minecraft:normal',
      enum: ['minecraft:normal', 'minecraft:flat'],
      minecraftVersion: { from: '1.19' },
    },
  ],
};

/** プロパティの定義だけを持つ外部リソース */
const resourceOf = (
  properties: ServerPropertiesResource['properties']
): ServerPropertiesResource => ({ properties });

const defaultOf = (
  entry: ServerPropertyEntryV1,
  version: string | undefined,
  versions: readonly string[] = order
) => selectPropertyDefinition(entry, version, versions).default;

describe('ワールドのバージョンに合うプロパティの定義の選択', () => {
  test('バージョンの範囲に合う定義を使う（範囲の両端を含む）', () => {
    expect(defaultOf(levelType, '1.21')).toBe('minecraft:normal');
    expect(defaultOf(levelType, '1.19')).toBe('minecraft:normal');
    expect(defaultOf(levelType, '1.18.2')).toBe('DEFAULT');
    expect(defaultOf(levelType, '1.18')).toBe('DEFAULT');
  });

  test('バージョン一覧に無い新しいバージョンや，ワールドに依らない場合は最新の定義を使う', () => {
    expect(defaultOf(levelType, '99.0')).toBe('minecraft:normal');
    expect(defaultOf(levelType, undefined)).toBe('minecraft:normal');
  });

  test('バージョン一覧を読み込めていない場合も最新の定義を使う', () => {
    expect(defaultOf(levelType, '1.18', [])).toBe('minecraft:normal');
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

  test('アプリの知らないバージョンが範囲の端にある場合は，一覧より新しいバージョンとみなす', () => {
    const entry: ServerPropertyEntryV1 = {
      definitions: [
        { type: 'number', default: 1, minecraftVersion: { to: '99.0' } },
        { type: 'number', default: 2, minecraftVersion: { from: '99.1' } },
      ],
    };
    expect(defaultOf(entry, '1.21')).toBe(1);
    expect(defaultOf(entry, '99.5')).toBe(2);
  });
});

describe('プロパティ画面で使う注釈', () => {
  test('定義のないプロパティは自由入力の文字列として扱う', () => {
    expect(
      getPropertyAnnotation(resourceOf({}), 'brand-new', '1.21', order)
    ).toEqual({ type: 'string', default: '' });
  });

  test('継承したキー（constructor など）も定義のないプロパティとして扱う', () => {
    expect(
      getPropertyAnnotation(resourceOf({}), 'constructor', '1.21', order)
    ).toEqual({ type: 'string', default: '' });
  });

  test('バージョンに合う定義の型・既定値・選択肢を返す', () => {
    expect(
      getPropertyAnnotation(
        resourceOf({ 'level-type': levelType }),
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

describe('ワールドのバージョンにまだ存在しないプロパティ', () => {
  const resource = resourceOf({
    'added-in-1.20': {
      definitions: [
        { type: 'boolean', default: true, minecraftVersion: { from: '1.20' } },
      ],
    },
    'level-type': levelType,
  });

  test('すべての定義の対応バージョンより古いワールドでは存在しない', () => {
    expect(isNotYetIntroduced(resource, 'added-in-1.20', '1.19', order)).toBe(
      true
    );
    expect(isNotYetIntroduced(resource, 'added-in-1.20', '1.20', order)).toBe(
      false
    );
  });

  test('下限のない定義がある場合や，ワールドのバージョンが分からない場合は存在するとみなす', () => {
    expect(isNotYetIntroduced(resource, 'level-type', '1.18', order)).toBe(
      false
    );
    expect(
      isNotYetIntroduced(resource, 'added-in-1.20', undefined, order)
    ).toBe(false);
    expect(isNotYetIntroduced(resource, 'added-in-1.20', '1.19', [])).toBe(
      false
    );
  });
});

describe('タブ', () => {
  const label = (id: string) => `label:${id}`;

  test('外部リソースでタブを定義していなければ，アプリ内のタブと「その他」を表示する', () => {
    expect(
      getPropertyGroups(resourceOf({}), 'ja', label).map((g) => g.id)
    ).toEqual([...builtInGroupKeys, OTHER_GROUP_ID]);
  });

  test('外部リソースで定義したタブを，その順と表示名で表示する（「その他」は末尾）', () => {
    const resource: ServerPropertiesResource = {
      groups: [
        { id: 'chat', label: { ja: 'チャット', 'en-US': 'Chat' } },
        { id: 'base', label: { ja: '基本' } },
      ],
      properties: {},
    };
    expect(getPropertyGroups(resource, 'en-US', label)).toEqual([
      { id: 'chat', label: 'Chat' },
      { id: 'base', label: '基本' },
      { id: OTHER_GROUP_ID, label: `label:${OTHER_GROUP_ID}` },
    ]);
  });

  test('外部リソースでタブを指定しないプロパティはアプリ内の分類に従う', () => {
    expect(getGroupProperties(resourceOf({}), 'security', [])).toEqual(
      propertyClasses.security
    );
  });

  test('外部リソースで指定したタブに，指定した通りに表示する', () => {
    const [moved] = propertyClasses.security;
    const resource: ServerPropertiesResource = {
      groups: [
        { id: 'security', label: { ja: 'セキュリティ' } },
        { id: 'chat', label: { ja: 'チャット' } },
      ],
      properties: {
        'brand-new': {
          groups: ['chat'],
          definitions: [{ type: 'boolean', default: false }],
        },
        [moved]: {
          groups: ['chat'],
          definitions: [{ type: 'boolean', default: false }],
        },
      },
    };
    expect(getGroupProperties(resource, 'chat', [])).toEqual([
      'brand-new',
      moved,
    ]);
    expect(getGroupProperties(resource, 'security', [])).not.toContain(moved);
  });

  test('「その他」には，表示中のどのタブにも属さないプロパティを表示する', () => {
    const resource: ServerPropertiesResource = {
      groups: [{ id: 'chat', label: { ja: 'チャット' } }],
      properties: {
        'in-chat': {
          groups: ['chat'],
          definitions: [{ type: 'boolean', default: false }],
        },
      },
    };
    // アプリ内で security に分類されたプロパティも，security タブが無ければ「その他」に表示する
    const [security] = propertyClasses.security;
    expect(
      getGroupProperties(resource, OTHER_GROUP_ID, [
        'in-chat',
        security,
        'unknown',
      ])
    ).toEqual([security, 'unknown']);
  });
});

describe('プロパティの説明文', () => {
  const builtIn = (key: string) => (key === 'known' ? 'アプリ内' : undefined);

  test('外部リソースの説明文を優先する', () => {
    const resource = resourceOf({
      known: {
        description: { ja: '外部', 'en-US': 'remote' },
        definitions: [{ type: 'string', default: '' }],
      },
    });
    expect(getPropertyDescription(resource, 'known', 'en-US', builtIn)).toBe(
      'remote'
    );
  });

  test('外部リソースに説明文がなければアプリ内の説明文を使う', () => {
    expect(getPropertyDescription(resourceOf({}), 'known', 'ja', builtIn)).toBe(
      'アプリ内'
    );
    expect(
      getPropertyDescription(resourceOf({}), 'other', 'ja', builtIn)
    ).toBeUndefined();
  });
});
