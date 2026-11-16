import { describe, expect, test } from 'vitest';
import { ServerPropertyDefinitions } from 'app/src-electron/schema/outerResource/serverProperties';
import { parseServerProperties } from './properties';

/** 外部リソースでのみ定義されたプロパティ（Minecraft の新しいバージョンで追加されたもの） */
const definitions: ServerPropertyDefinitions = {
  'new-flag': { definitions: [{ type: 'boolean', default: false }] },
  'new-limit': {
    definitions: [{ type: 'number', default: 10, min: 0, max: 20 }],
  },
  'changing-type': {
    definitions: [
      { type: 'number', default: 1, minecraftVersion: { to: '1.20' } },
      { type: 'string', default: 'a', minecraftVersion: { from: '1.21' } },
    ],
  },
  // アプリ内で数値として定義されているプロパティ
  'max-players': { definitions: [{ type: 'number', default: 20 }] },
};

describe('外部リソースの定義を使った server.properties の読み込み', () => {
  test('外部リソースでのみ定義されたプロパティを定義の型で読み込む', () => {
    const parsed = parseServerProperties(
      'new-flag=TRUE\nnew-limit=15',
      definitions
    );
    expect(parsed['new-flag']).toBe(true);
    expect(parsed['new-limit']).toBe(15);
  });

  test('定義の範囲外の値や変換できない値も，ユーザーの値をそのまま残す', () => {
    const parsed = parseServerProperties(
      'new-limit=999\nnew-flag=maybe',
      definitions
    );
    expect(parsed['new-limit']).toBe(999);
    expect(parsed['new-flag']).toBe('maybe');
  });

  test('バージョンによって型が異なるプロパティは文字列のまま読み込む', () => {
    const parsed = parseServerProperties('changing-type=3', definitions);
    expect(parsed['changing-type']).toBe('3');
  });

  test.each(['0x10', '1e3', '007', '1.', '+5', '1.50', '9007199254740993'])(
    '10進数でない数値の表記 %s はユーザーの表記のまま残す',
    (value) => {
      const parsed = parseServerProperties(`new-limit=${value}`, definitions);
      expect(parsed['new-limit']).toBe(value);
    }
  );

  test('継承したキー（constructor など）があっても読み込める', () => {
    const parsed = parseServerProperties(
      ['constructor=1', 'toString=x'].join('\n'),
      definitions
    );
    expect(parsed['constructor']).toBe('1');
    expect(parsed['toString']).toBe('x');
  });

  test('定義のないプロパティは文字列のまま読み込む', () => {
    const parsed = parseServerProperties('unknown-prop=true', definitions);
    expect(parsed['unknown-prop']).toBe('true');
  });

  test('アプリ内で定義されたプロパティの読み込みは変わらない', () => {
    const parsed = parseServerProperties(
      'max-players=abc\nwhite-list=true',
      definitions
    );
    expect(parsed['max-players']).toBe(20);
    expect(parsed['white-list']).toBe(true);
  });
});
