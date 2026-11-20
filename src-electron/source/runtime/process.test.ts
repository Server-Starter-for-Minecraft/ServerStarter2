import path from 'path';
import { beforeAll, describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { interactiveJavaProcess, javaProcessEnv } from './process';

const workPath = new Path(__dirname).child('work', 'process');
/** 子プロセスから見えるPATHと`JAVA_HOME`をJSONとして標準出力に書き出すスクリプト */
const printEnvScript = workPath.child('print env.js');

beforeAll(async () => {
  await workPath.emptyDir();
  await printEnvScript.writeText(
    [
      "const key = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH');",
      'process.stdout.write(JSON.stringify({ path: process.env[key], javaHome: process.env.JAVA_HOME }));',
    ].join('\n')
  );
});

/** テスト用のJavaの配置（`<JAVA_HOME>/bin/java`） */
const javaHome = workPath.child('runtime', 'java-runtime-delta');
const javaPath = javaHome.child('bin', 'java');

/** PATHを要素ごとに分割する */
const splitPath = (value: string | undefined) =>
  (value ?? '').split(path.delimiter);

describe('javaProcessEnv', () => {
  test('用意したJavaのbinフォルダがPATHの先頭になり，元のPATHも引き継がれる', () => {
    const env = javaProcessEnv(javaPath, {
      PATH: ['/usr/bin', '/opt/java/bin'].join(path.delimiter),
    });

    expect(splitPath(env.PATH)).toEqual([
      javaPath.parent().path,
      '/usr/bin',
      '/opt/java/bin',
    ]);
  });

  test('JAVA_HOMEが用意したJavaを指す', () => {
    const env = javaProcessEnv(javaPath, { JAVA_HOME: '/opt/java' });

    expect(env.JAVA_HOME).toBe(javaHome.path);
  });

  test('PATH・JAVA_HOME以外の環境変数はそのまま引き継がれる', () => {
    const env = javaProcessEnv(javaPath, { PATH: '/usr/bin', LANG: 'ja_JP' });

    expect(env.LANG).toBe('ja_JP');
  });

  test('PATHのキー名の大文字小文字が異なる場合（Windowsの`Path`など）も，PATHは1つにまとめられる', () => {
    const env = javaProcessEnv(javaPath, { Path: '/usr/bin' });

    const pathKeys = Object.keys(env).filter((k) => k.toUpperCase() === 'PATH');
    expect(pathKeys).toHaveLength(1);
    expect(splitPath(env[pathKeys[0]])).toEqual([
      javaPath.parent().path,
      '/usr/bin',
    ]);
  });

  test('PATHが未設定の場合は，用意したJavaのbinフォルダのみがPATHになる', () => {
    const env = javaProcessEnv(javaPath, {});

    expect(env.PATH).toBe(javaPath.parent().path);
  });

  test('元の環境変数を書き換えない', () => {
    const baseEnv = { PATH: '/usr/bin' };

    javaProcessEnv(javaPath, baseEnv);

    expect(baseEnv).toEqual({ PATH: '/usr/bin' });
  });
});

describe('interactiveJavaProcess', () => {
  test('起動した子プロセスでは，起動に使った実行ファイルのフォルダがPATHの先頭になる', async () => {
    // テストを実行しているランタイム自身をJavaに見立てて起動する
    const runtimePath = new Path(process.execPath);
    let stdout = '';

    const result = await interactiveJavaProcess(
      runtimePath,
      [printEnvScript.path],
      (chunk) => (stdout += chunk),
      undefined,
      workPath
    );

    expect(result).toBeUndefined();
    const childEnv = JSON.parse(stdout);
    expect(splitPath(childEnv.path)[0]).toBe(runtimePath.parent().path);
    expect(childEnv.javaHome).toBe(runtimePath.parent().parent().path);
  });
});
