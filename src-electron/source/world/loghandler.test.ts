import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ConsoleOutput } from 'app/src-electron/schema/console';
import { Path } from 'app/src-electron/util/binary/path';

const workPath = new Path(__dirname).child('work', 'loghandler');

// 一時ファイルはテスト用のフォルダに作成する
vi.mock('app/src-electron/util/tempPath', () => ({
  allocateTempDir: async () => {
    const dir = workPath.child('temp');
    await dir.mkdir(true);
    return dir;
  },
}));

const { WorldLogHandler } = await import('./loghandler');

const ESC = '\u001b';
const worldPath = workPath.child('world');

/** サーバーを1回起動し、指定した出力をした後に終了したときのログの記録 */
async function runServer(outputs: ConsoleOutput[]) {
  const handler = new WorldLogHandler(worldPath);
  await handler.archive();
  outputs.forEach((o) => handler.append(o));
  await handler.flash();
}

describe('WorldLogHandler', () => {
  beforeEach(async () => {
    await workPath.remove();
  });

  test('記録した出力を、出力の区切りと標準エラー出力の区別を保ったまま取得できる', async () => {
    const outputs = [
      { text: `${ESC}[32m[INFO]${ESC}[m Starting\n`, isError: false },
      { text: 'Exception\n\tat Foo\n', isError: true },
      { text: '\r[===   ] 50%', isError: false },
    ];
    await runServer(outputs);

    expect(await new WorldLogHandler(worldPath).loadLatest()).toEqual(outputs);
  });

  test('latest.logにはANSIエスケープシーケンスを除いたテキストを保存する', async () => {
    await runServer([
      { text: `${ESC}[32m[INFO]${ESC}[m Starting\n`, isError: false },
      { text: 'Exception\n', isError: true },
    ]);

    expect(await worldPath.child('logs', 'latest.log').readText()).toBe(
      '[INFO] Starting\nException\n'
    );
  });

  test('再度起動した場合は、最新の起動時の出力のみを取得する', async () => {
    await runServer([{ text: 'first\n', isError: true }]);
    await runServer([{ text: 'second\n', isError: false }]);

    expect(await new WorldLogHandler(worldPath).loadLatest()).toEqual([
      { text: 'second\n', isError: false },
    ]);
  });

  test('出力ごとの記録が無い以前のログは、latest.logの各行を出力として取得する', async () => {
    await worldPath.child('logs', 'latest.log').writeText('line1\nline2\n');

    expect(await new WorldLogHandler(worldPath).loadLatest()).toEqual([
      { text: 'line1\n', isError: false },
      { text: 'line2\n', isError: false },
    ]);
  });

  test('本アプリ以外から起動してlatest.logのみが更新された場合は、latest.logの内容を取得する', async () => {
    await runServer([{ text: 'old\n', isError: true }]);
    // サーバー自身がlatest.logを書き換える
    await worldPath.child('logs', 'latest.log').writeText('new1\nnew2\n');

    expect(await new WorldLogHandler(worldPath).loadLatest()).toEqual([
      { text: 'new1\n', isError: false },
      { text: 'new2\n', isError: false },
    ]);
  });

  test('出力ごとの記録が途中で途切れて読み取れない場合も、latest.logの内容を取得できる', async () => {
    const logs = worldPath.child('logs');
    await logs.child('latest.log').writeText('line1\nline2\n');
    await logs
      .child('latest.console.jsonl')
      .writeText('{"text":"line1\\n","isError":false}\n{"text":"li');

    expect(await new WorldLogHandler(worldPath).loadLatest()).toEqual([
      { text: 'line1\n', isError: false },
      { text: 'line2\n', isError: false },
    ]);
  });
});
