import { ConsoleData } from 'app/src/schema/console';
import { describe, expect, test } from 'vitest';
import {
  ConsoleOutputParser,
  lineToConsoleData,
  overlayMatches,
} from './consoleLine';

const ESC = '\u001b';

/** サーバーからの出力を順に追加した後のコンソールの行一覧 */
function receive(...outputs: string[]) {
  const parser = new ConsoleOutputParser();
  const lines: ConsoleData[] = [];
  outputs.forEach((o) => parser.append(lines, o, false));
  return lines;
}

/** サーバーからの出力を順に追加した後の、コンソールに表示される文字列 */
function displayed(...outputs: string[]) {
  return receive(...outputs)
    .map((l) => l.chunk)
    .join('');
}

/** 指定した文字列が表示されている部分の文字色 */
function colorOf(lines: ConsoleData[], text: string) {
  const seg = lines
    .flatMap((l) => l.segments ?? [])
    .find((s) => s.text.includes(text));
  return seg?.style.color;
}

describe('ConsoleOutputParser', () => {
  test('通常の出力はそのまま順に表示される', () => {
    expect(displayed('line1\n', 'line2\nline3\n')).toBe(
      'line1\nline2\nline3\n'
    );
  });

  test('改行で終わる出力ごとに、まとまりとして表示される', () => {
    expect(receive('line1\n', 'line2\nline3\n')).toHaveLength(2);
  });

  test('行の途中で分割されて届いた出力は、同じ行の続きとして表示される', () => {
    const lines = receive('[INFO]: Prep', 'aring spawn area\n', 'next\n');

    expect(lines.map((l) => l.chunk)).toEqual([
      '[INFO]: Preparing spawn area\n',
      'next\n',
    ]);
  });

  test('プログレスバーのように\\rで書き換えられる出力は、同じ行が更新される', () => {
    expect(
      displayed(
        'Libraries:\n',
        '\r[=     ] 10%',
        '\r[===   ] 50%',
        '\r[======] 100%\n',
        'Done\n'
      )
    ).toBe('Libraries:\n[======] 100%\nDone\n');
  });

  test('\\rで終わる出力は、次の出力が届くまで表示され、次の出力でその行が上書きされる', () => {
    expect(displayed('Downloading 10%\r')).toBe('Downloading 10%');
    expect(displayed('Downloading 10%\r', 'Downloading 60%\r')).toBe(
      'Downloading 60%'
    );
  });

  test('上書きされるのは最終行のみで、それより前の行は残る', () => {
    expect(displayed('a\nb\nDL 10%\r', 'DL 20%\r')).toBe('a\nb\nDL 20%');
    expect(displayed('a\nb\nc', '\r50%')).toBe('a\nb\n50%');
  });

  test('1回の出力の中で\\rにより書き換えられた場合は最後の内容を表示する', () => {
    expect(displayed('10%\r50%\r100%\nnext\n')).toBe('100%\nnext\n');
  });

  test('改行コードがCRLFの出力は、出力の境界で分割されていても書き換えとみなさない', () => {
    expect(displayed('line1\r\n', 'line2\r\n')).toBe('line1\nline2\n');
    expect(displayed('line1\r', '\nline2\r\n')).toBe('line1\nline2\n');
  });

  test('空の出力は行として追加しない', () => {
    expect(receive('', 'line\n')).toHaveLength(1);
  });

  test('表示文字列（検索対象）には色指定の制御文字を含まない', () => {
    expect(displayed(`${ESC}[33mWARN${ESC}[0m message\n`)).toBe(
      'WARN message\n'
    );
  });

  test('文字色は改行や出力をまたいで、リセットされるまで引き継がれる', () => {
    const lines = receive(`${ESC}[31mline1\n`, 'line2\n', `${ESC}[0mline3\n`);

    expect(colorOf(lines, 'line1')).toBeDefined();
    expect(colorOf(lines, 'line2')).toBe(colorOf(lines, 'line1'));
    expect(colorOf(lines, 'line3')).toBeUndefined();
  });

  test('\\rで上書きされた部分で指定された文字色も引き継がれる', () => {
    const lines = receive(`${ESC}[31m10%\r50%${ESC}[0m\n`);

    expect(displayed(`${ESC}[31m10%\r50%${ESC}[0m\n`)).toBe('50%\n');
    expect(colorOf(lines, '50%')).toBeDefined();
  });

  test('出力の境界で分割されたエスケープシーケンスも解釈する', () => {
    const lines = receive(`abc${ESC}[3`, '1mred\n');

    expect(lines.map((l) => l.chunk).join('')).toBe('abcred\n');
    expect(colorOf(lines, 'red')).toBeDefined();
    expect(colorOf(lines, 'abc')).toBeUndefined();
  });
});

describe('lineToConsoleData', () => {
  test('ファイルから読み込んだ行を、装飾を解釈した行データに変換する', () => {
    const data = lineToConsoleData(`${ESC}[32m[INFO]${ESC}[m Starting`, true);

    expect(data.chunk).toBe('[INFO] Starting');
    expect(data.isError).toBe(true);
    expect(data.segments?.[0].style.color).toBeDefined();
  });
});

describe('overlayMatches', () => {
  test('文字色の境界と検索結果の境界の両方で分割し、それぞれの情報を保持する', () => {
    const data = lineToConsoleData(`ab${ESC}[31mcd${ESC}[0mef`, false);
    const pieces = overlayMatches(data.segments ?? [], [
      { text: 'a', isMatch: false },
      { text: 'bcd', isMatch: true },
      { text: 'ef', isMatch: false },
    ]);

    expect(
      pieces.map((p) => [p.text, p.isMatch, p.style.color !== undefined])
    ).toEqual([
      ['a', false, false],
      ['b', true, false],
      ['cd', true, true],
      ['ef', false, false],
    ]);
  });
});
