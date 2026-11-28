import { describe, expect, test } from 'vitest';
import { textComponentToString } from './textComponent';

describe('テキストコンポーネントの文字列への変換', () => {
  test.each<[string, unknown, string]>([
    ['文字列', '§aGreen pack', '§aGreen pack'],
    ['数値', 42, '42'],
    ['textを持つオブジェクト', { text: 'hello', color: 'red' }, 'hello'],
    [
      'extraを持つオブジェクト',
      { text: 'a', extra: ['b', { text: 'c' }] },
      'abc',
    ],
    ['配列', ['a', { text: 'b' }, 1], 'ab1'],
    ['fallbackのある翻訳', { translate: 'x.y', fallback: 'XY' }, 'XY'],
    ['fallbackのない翻訳', { translate: 'x.y' }, 'x.y'],
    ['キー割り当て', { keybind: 'key.jump' }, 'key.jump'],
    ['ゲーム内でのみ解決できる内容', { selector: '@p' }, ''],
    ['null', null, ''],
    ['未定義', undefined, ''],
  ])('%s', (_, component, expected) => {
    expect(textComponentToString(component)).toBe(expected);
  });
});
