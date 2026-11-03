import { beforeEach, describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { readScriptArgs, ScriptExt } from './forgeArgAnalyzer';

const workPath = new Path(__dirname).child('work', 'forgeArgAnalyzer');

beforeEach(async () => {
  await workPath.emptyDir();
});

describe('起動スクリプトからの実行時引数の読み取り', () => {
  const ARGS_FILE = '@libraries/net/neoforged/neoforge/26.3.0.101/args.txt';

  test.each<{ name: string; ext: ScriptExt; script: string[] }>([
    {
      name: 'bat',
      ext: '.bat',
      script: [
        '@echo off',
        'REM Add custom JVM arguments to the user_jvm_args.txt',
        `java @user_jvm_args.txt ${ARGS_FILE} %*`,
        'pause',
      ],
    },
    {
      name: 'sh',
      ext: '.sh',
      script: [
        '#!/usr/bin/env sh',
        '# Add custom JVM arguments to the user_jvm_args.txt',
        `java @user_jvm_args.txt ${ARGS_FILE} "$@"`,
      ],
    },
    {
      // NeoForge 26.x 以降のインストーラが書き出す形式
      name: 'sh（execで起動）',
      ext: '.sh',
      script: [
        '#!/usr/bin/env sh',
        '# Add custom JVM arguments to the user_jvm_args.txt',
        `exec java @user_jvm_args.txt ${ARGS_FILE} "$@"`,
      ],
    },
  ])(
    '起動スクリプト（$name）から引数ファイルを読み取れる',
    async ({ ext, script }) => {
      const scriptPath = workPath.child(`version${ext}`);
      await scriptPath.writeText(script.join('\n'));

      const args = await readScriptArgs(scriptPath, ext);

      expect(args).toEqual([ARGS_FILE]);
    }
  );

  test('Javaを起動する行がない起動スクリプトはエラーになる', async () => {
    const scriptPath = workPath.child('version.sh');
    await scriptPath.writeText(['#!/usr/bin/env sh', 'echo hello'].join('\n'));

    const args = await readScriptArgs(scriptPath, '.sh');

    expect(isError(args)).toBe(true);
  });
});
