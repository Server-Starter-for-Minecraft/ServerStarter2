import { ConsoleData } from 'app/src/schema/console';
import { describe, expect, test } from 'vitest';
import {
  appendConsoleOutput,
  overlayMatches,
  toConsoleData,
} from './consoleLine';

const ESC = '\u001b';

/** サーバーからの出力を順に追加した後の、コンソールに表示される文字列の一覧 */
function displayed(...outputs: string[]) {
  const lines: ConsoleData[] = [];
  outputs.forEach((o) => appendConsoleOutput(lines, o, false));
  return lines.map((l) => l.chunk);
}

describe('appendConsoleOutput', () => {
  test('通常の出力は1つずつ行として追加される', () => {
    expect(displayed('line1\n', 'line2\n')).toEqual(['line1\n', 'line2\n']);
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
    ).toEqual(['Libraries:\n', '[======] 100%\n', 'Done\n']);
  });

  test('\\rで終わる出力の次の出力は、端末と同様にその行を上書きする', () => {
    expect(displayed('Downloading 10%\r', 'Downloading 60%\r')).toEqual([
      'Downloading 60%',
    ]);
    expect(
      displayed('Downloading 10%\r', 'Downloading 100%\r', 'Done\n', 'next\n')
    ).toEqual(['Done\n', 'next\n']);
  });

  test('1回の出力の中で\\rにより書き換えられた場合は最後の内容を表示する', () => {
    expect(displayed('10%\r50%\r100%\nnext\n')).toEqual(['100%\nnext\n']);
  });

  test('改行コードがCRLFの出力は書き換えとみなさない', () => {
    expect(displayed('line1\r\n', 'line2\r\n')).toEqual(['line1\n', 'line2\n']);
  });

  test('空の出力は行として追加しない', () => {
    expect(displayed('', 'line\n')).toEqual(['line\n']);
  });
});

describe('toConsoleData', () => {
  test('表示文字列（検索対象）には色指定の制御文字を含まない', () => {
    const data = toConsoleData(`${ESC}[33mWARN${ESC}[0m message`, false);

    expect(data.chunk).toBe('WARN message');
    expect(data.segments?.map((s) => s.text)).toEqual(['WARN', ' message']);
  });

  test('改行をまたいでも文字色が引き継がれる', () => {
    const data = toConsoleData(`${ESC}[31mline1\nline2${ESC}[0m`, true);

    expect(data.segments).toHaveLength(1);
    expect(data.segments?.[0].text).toBe('line1\nline2');
    expect(data.segments?.[0].style.color).toBeDefined();
    expect(data.isError).toBe(true);
  });
});

describe('overlayMatches', () => {
  test('文字色の境界と検索結果の境界の両方で分割し、それぞれの情報を保持する', () => {
    const data = toConsoleData(`ab${ESC}[31mcd${ESC}[0mef`, false);
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
