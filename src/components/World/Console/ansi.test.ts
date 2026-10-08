import { describe, expect, test } from 'vitest';
import { ansiStyleToCss, parseAnsi, splitIncompleteEscape } from './ansi';

const ESC = '\u001b';

/** 装飾付きテキストを、表示される文字列とCSSの組に変換する */
function render(raw: string, isDark = true) {
  return parseAnsi(raw).segments.map(
    (s) => [s.text, ansiStyleToCss(s.style, isDark)] as const
  );
}

describe('parseAnsi', () => {
  test('装飾のない出力はそのまま1つの断片になる', () => {
    expect(render('[Server thread/INFO]: Done (2.4s)!')).toEqual([
      ['[Server thread/INFO]: Done (2.4s)!', {}],
    ]);
  });

  test('文字色の指定とリセットで、色付きの部分と色のない部分に分かれる', () => {
    const pieces = render(`Download ${ESC}[33m50%${ESC}[0m done`);

    expect(pieces.map(([text]) => text)).toEqual(['Download ', '50%', ' done']);
    expect(pieces[0][1]).toEqual({});
    expect(pieces[1][1]).toHaveProperty('color');
    expect(pieces[2][1]).toEqual({});
  });

  test('256色・トゥルーカラーの指定を解釈する', () => {
    const [[, color256]] = render(`${ESC}[38;5;196mred`);
    const [[, trueColor]] = render(`${ESC}[38;2;255;170;0mgold`);

    expect(color256.color).toBe('rgb(255,0,0)');
    expect(trueColor.color).toBe('#ffaa00');
  });

  test('太字・下線・背景色を解釈する', () => {
    const [[, style]] = render(`${ESC}[1;4;41mwarn`);

    expect(style['font-weight']).toBe('bold');
    expect(style['text-decoration']).toBe('underline');
    expect(style).toHaveProperty('background-color');
  });

  test('文字色以外の制御シーケンス（カーソル移動・タイトル変更・文字集合の指定など）は表示しない', () => {
    const raw = `${ESC}]0;Minecraft Server\u0007${ESC}[2K${ESC}[1G> help${ESC}(B\u009b0m`;

    expect(render(raw)).toEqual([['> help', {}]]);
  });

  test('文字列の末尾時点の装飾を返し、後続の文字列に引き継げる', () => {
    const first = parseAnsi(`${ESC}[31mred`);
    const second = parseAnsi('still red', first.endStyle);

    expect(second.segments[0].style).toEqual(first.segments[0].style);
  });

  test('テーマに応じて背景色に対して読みやすい色を使う', () => {
    const [[, dark]] = render(`${ESC}[97mwhite`, true);
    const [[, light]] = render(`${ESC}[97mwhite`, false);

    expect(dark.color).not.toBe(light.color);
  });

  test('DCSなどの文字列を伴う制御シーケンスは、終端までの内容も表示しない', () => {
    expect(render(`a${ESC}Pq#0;2;0;0;0${ESC}\\b`)).toEqual([['ab', {}]]);
    // 内容に改行を含む場合も、終端までを取り除く
    expect(render(`a${ESC}Pq#0\n#1${ESC}\\b`)).toEqual([['ab', {}]]);
  });
});

describe('splitIncompleteEscape', () => {
  test('末尾で途切れたエスケープシーケンスを後続の出力と結合するために分ける', () => {
    expect(splitIncompleteEscape(`abc${ESC}[3`)).toEqual({
      complete: 'abc',
      pending: `${ESC}[3`,
    });
    expect(splitIncompleteEscape(`abc${ESC}`)).toEqual({
      complete: 'abc',
      pending: ESC,
    });
    // 終端（ESC \）の途中で分割された場合も、文字列全体を保留する
    expect(splitIncompleteEscape(`abc${ESC}Pdata${ESC}`)).toEqual({
      complete: 'abc',
      pending: `${ESC}Pdata${ESC}`,
    });
  });

  test('完結しているエスケープシーケンスはそのまま解釈する', () => {
    expect(splitIncompleteEscape(`abc${ESC}[31m`)).toEqual({
      complete: `abc${ESC}[31m`,
      pending: '',
    });
  });
});
