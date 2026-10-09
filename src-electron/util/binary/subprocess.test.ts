import { beforeAll, describe, expect, test } from 'vitest';
import { Path } from './path';
import { execProcess, interactiveProcess } from './subprocess';

/** 作業ディレクトリ（スペースを含むパスでも起動できることを確認する） */
const workPath = new Path(__dirname).child('work', 'subprocess dir');
/** 受け取った引数をJSONとして標準出力に書き出すスクリプト */
const echoArgsScript = workPath.child('echo args.js');
/** 第1引数が`a b`の場合のみ正常終了するスクリプト */
const expectArgScript = workPath.child('expect arg.js');
/** テストで起動する実行ファイル（テストを実行しているランタイム自身） */
const runtimePath = new Path(process.execPath);

beforeAll(async () => {
  await workPath.emptyDir();
  await echoArgsScript.writeText(
    'process.stdout.write(JSON.stringify(process.argv.slice(2)))'
  );
  await expectArgScript.writeText(
    "process.exit(process.argv[2] === 'a b' ? 0 : 1)"
  );
});

/** プロセスを起動し，標準出力を連結した文字列を返す */
async function runAndReadStdout(args: string[]) {
  let stdout = '';
  const result = await interactiveProcess(
    runtimePath,
    [echoArgsScript.path, ...args],
    (chunk) => (stdout += chunk),
    undefined,
    workPath
  );
  return { result, stdout };
}

describe('interactiveProcess', () => {
  test('スペースやシェルの特殊文字を含む引数がそのまま1つの引数として渡される', async () => {
    const args = [
      '-Dname=a b',
      '-Dcmd=1&echo injected',
      '-Dpipe=a|b',
      '"quoted"',
      '$HOME',
      '%PATH%',
    ];
    const { result, stdout } = await runAndReadStdout(args);

    expect(result).toBeUndefined();
    expect(JSON.parse(stdout)).toEqual(args);
  });
});

describe('execProcess', () => {
  test('スペースを含むパスのスクリプトに，スペースを含む引数をそのまま渡せる', async () => {
    const result = await execProcess(
      runtimePath,
      [expectArgScript.path, 'a b'],
      workPath
    );
    expect(result).toBeUndefined();
  });
});
