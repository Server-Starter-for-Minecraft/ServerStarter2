import { errorMessage } from './error/construct';
import { isError } from './error/error';
import { Failable } from './error/failable';

/**
 * コマンドライン引数をパースする
 *
 * 空白区切りで引数に分割し，引用符で囲まれた範囲は空白を含めて1つの引数として扱う．
 * 子プロセスはシェルを介さずに起動するため，引数を囲む引用符はここで取り除く．
 *
 * - `"..."`：囲みの中の`\"`のみを`"`として扱う（Windowsのパス区切り文字を壊さないため，その他の`\`はそのまま残す）
 * - `'...'`：囲みの中の文字をすべてそのまま扱う
 * - 環境変数（`%TEMP%`や`$HOME`など）は展開せず，文字列のまま渡す
 *
 * @example
 * parseCommandLine(`-Xmx2G "-Dname=a b" -Dpath='C:\\My Dir'`)
 * // => ['-Xmx2G', '-Dname=a b', '-Dpath=C:\\My Dir']
 *
 * @param commandLine ユーザーが入力したコマンドライン文字列
 * @returns 子プロセスにそのまま渡せる引数の配列（引用符が閉じられていない場合はエラー）
 */
export function parseCommandLine(commandLine: string): Failable<string[]> {
  const args: string[] = [];
  /** 組み立て中の引数（空白のみの区間では`undefined`） */
  let current: string | undefined;
  /** 現在囲まれている引用符の種類 */
  let quote: '"' | "'" | undefined;

  for (let i = 0; i < commandLine.length; i++) {
    const char = commandLine[i];

    if (quote !== undefined) {
      // 引用符の内側
      if (char === quote) {
        quote = undefined;
      } else if (quote === '"' && char === '\\' && commandLine[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      // 引用符の開始（`-Dx="a b"`のように引数の途中から囲むこともできる）
      quote = char;
      current ??= '';
    } else if (/\s/.test(char)) {
      // 空白で引数を区切る
      if (current !== undefined) args.push(current);
      current = undefined;
    } else {
      current = (current ?? '') + char;
    }
  }

  // 引用符が閉じられていない場合は，意図しない引数の分割を防ぐためにエラーとする
  if (quote !== undefined) {
    return errorMessage.value.commandLineArgument({ value: commandLine });
  }
  if (current !== undefined) args.push(current);
  return args;
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect, describe } = import.meta.vitest;
  describe('parseCommandLine', () => {
    test('空文字列は引数なしとして扱う', () => {
      expect(parseCommandLine('')).toEqual([]);
    });

    test('空白区切りで引数に分割する', () => {
      expect(parseCommandLine('-Xmx2G  -Xms1G -XX:+UseG1GC')).toEqual([
        '-Xmx2G',
        '-Xms1G',
        '-XX:+UseG1GC',
      ]);
    });

    test('引用符で囲まれた範囲は空白を含めて1つの引数となり，引用符は取り除かれる', () => {
      expect(
        parseCommandLine('"-Dname=a b" -Dpath="C:\\My Dir\\java" -Dx=1')
      ).toEqual(['-Dname=a b', '-Dpath=C:\\My Dir\\java', '-Dx=1']);
    });

    test('引用符の中でエスケープされた引用符は文字として残る', () => {
      expect(parseCommandLine('-Dmsg="say \\"hi\\""')).toEqual([
        '-Dmsg=say "hi"',
      ]);
    });

    test('シングルクォートで囲まれた範囲は中身をそのまま1つの引数とする', () => {
      expect(parseCommandLine("-Dname='a \"b\" c' 'C:\\My Dir\\'")).toEqual([
        '-Dname=a "b" c',
        'C:\\My Dir\\',
      ]);
    });

    test('空の引用符は空文字列の引数となる', () => {
      expect(parseCommandLine('-a "" -b')).toEqual(['-a', '', '-b']);
    });

    test('引用符が閉じられていない場合はエラーとなる', () => {
      expect(isError(parseCommandLine('-Da="b c'))).toBe(true);
      expect(isError(parseCommandLine("-Da='b c"))).toBe(true);
      expect(isError(parseCommandLine('-Dpath="C:\\My Dir\\"'))).toBe(true);
    });

    test('シェルの特殊文字はそのまま引数の一部として扱う', () => {
      expect(parseCommandLine('-Da=1&echo -Db=$HOME|x')).toEqual([
        '-Da=1&echo',
        '-Db=$HOME|x',
      ]);
      expect(parseCommandLine('-Djava.io.tmpdir=%TEMP%')).toEqual([
        '-Djava.io.tmpdir=%TEMP%',
      ]);
    });
  });
}
