import { describe, expect, test } from 'vitest';
import { ansiStyleToCss, parseAnsi, stripAnsi } from './ansi';

const ESC = '\u001b';

/** 装飾付きテキストを、表示される文字列とCSSの文字色の組に変換する */
function render(raw: string, isDark = true) {
  return parseAnsi(raw).map(
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

  test('文字色以外の制御シーケンス（カーソル移動・タイトル変更など）は表示しない', () => {
    const raw = `${ESC}]0;Minecraft Server\u0007${ESC}[2K${ESC}[1G> help`;

    expect(render(raw)).toEqual([['> help', {}]]);
  });

  test('テーマに応じて背景色に対して読みやすい色を使う', () => {
    const [[, dark]] = render(`${ESC}[97mwhite`, true);
    const [[, light]] = render(`${ESC}[97mwhite`, false);

    expect(dark.color).not.toBe(light.color);
  });
});

describe('stripAnsi', () => {
  test('制御シーケンスを取り除いた表示文字列を返す', () => {
    expect(stripAnsi(`${ESC}[32m[INFO]${ESC}[m Starting`)).toBe(
      '[INFO] Starting'
    );
  });
});
