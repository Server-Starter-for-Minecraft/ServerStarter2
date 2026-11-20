import { describe, expect, test } from 'vitest';
import { OnlinePlayersTracker, parsePlayerConnection } from './onlinePlayers';

/** 各サーバー種別・バージョンで出力されるログのヘッダー */
const headers = {
  vanilla: '[12:34:56] [Server thread/INFO]: ',
  forge:
    '[02Oct2026 12:34:56.789] [Server thread/INFO] [net.minecraft.server.MinecraftServer/]: ',
  paper: '[12:34:56 INFO]: ',
  legacy: '2013-07-10 12:34:56 [INFO] ',
  legacyForge: '2013-07-10 12:34:56 [INFO] [Minecraft-Server] ',
};

describe('parsePlayerConnection', () => {
  describe.each(Object.entries(headers))('%s形式のログ', (_, header) => {
    test('参加メッセージを参加として判定する', async () => {
      expect(
        await parsePlayerConnection(`${header}Steve joined the game`)
      ).toEqual({
        type: 'join',
        name: 'Steve',
      });
    });

    test('退出メッセージを退出として判定する', async () => {
      expect(
        await parsePlayerConnection(`${header}Steve left the game`)
      ).toEqual({
        type: 'leave',
        name: 'Steve',
      });
    });

    test.each([
      ['チャット', '<Alex> Steve joined the game'],
      ['/sayコマンド', '[Server] Steve joined the game'],
      ['/sayコマンド (プレイヤーによる実行)', '[Alex] Steve left the game'],
      ['入退室と無関係なログ', 'Done (3.637s)! For help, type "help"'],
      ['プレイヤー名として不正な文字列', 'Steve Jobs joined the game'],
    ])('入退室以外のログは判定しない (%s)', async (_, body) => {
      expect(await parsePlayerConnection(`${header}${body}`)).toBeUndefined();
    });
  });

  test('ヘッダーの無い出力は判定しない', async () => {
    expect(
      await parsePlayerConnection('Steve joined the game')
    ).toBeUndefined();
  });

  test.each([
    // 1.7以降の形式
    '[12:34:56] [Server thread/INFO]: Steve[/127.0.0.1:52596] logged in with entity id 123 at (0.5, 64.0, 0.5)',
    // Paper等の形式
    '[12:34:56 INFO]: Steve[/127.0.0.1:52596] logged in with entity id 123 at ([world]0.5, 64.0, 0.5)',
    // 1.6以前の形式
    '2013-07-10 12:34:56 [INFO] Steve [/127.0.0.1:52596] logged in with entity id 123 at (0.5, 64.0, 0.5)',
  ])(
    '参加メッセージがプラグイン等で変更されていてもログイン時のログで参加を判定する: %s',
    async (line) => {
      expect(await parsePlayerConnection(line)).toEqual({
        type: 'join',
        name: 'Steve',
      });
    }
  );

  test.each([
    '[12:34:56] [Server thread/INFO]: Steve lost connection: Disconnected',
    '[12:34:56] [Server thread/INFO]: Steve lost connection: Timed out',
    '2013-07-10 12:34:56 [INFO] Steve lost connection: disconnect.quitting',
  ])('切断時のログで退出を判定する: %s', async (line) => {
    expect(await parsePlayerConnection(line)).toEqual({
      type: 'leave',
      name: 'Steve',
    });
  });

  test('名前を変更したプレイヤーは現在の名前で判定する', async () => {
    expect(
      await parsePlayerConnection(
        `${headers.vanilla}NewName (formerly known as OldName) joined the game`
      )
    ).toEqual({ type: 'join', name: 'NewName' });
  });

  test('改行コードが末尾に残っていても判定できる', async () => {
    expect(
      await parsePlayerConnection(`${headers.vanilla}Steve joined the game\r`)
    ).toEqual({ type: 'join', name: 'Steve' });
  });
});

describe('OnlinePlayersTracker', () => {
  /** トラッカーと，通知された参加中プレイヤー一覧の履歴を生成する */
  function setup() {
    const notified: string[][] = [];
    const tracker = new OnlinePlayersTracker((players) =>
      notified.push(players)
    );
    return { tracker, notified };
  }

  test('入退室に合わせて参加中のプレイヤー一覧を通知する', async () => {
    const { tracker, notified } = setup();

    await tracker.push(`${headers.vanilla}Steve joined the game\n`);
    await tracker.push(`${headers.vanilla}Alex joined the game\n`);
    await tracker.push(`${headers.vanilla}Steve left the game\n`);

    expect(notified).toEqual([['Steve'], ['Steve', 'Alex'], ['Alex']]);
    expect(tracker.onlinePlayers).toEqual(['Alex']);
  });

  test('1回の出力に複数行が含まれていても全て反映する', async () => {
    const { tracker } = setup();

    await tracker.push(
      [
        `${headers.vanilla}Steve joined the game`,
        `${headers.vanilla}Alex joined the game`,
        '',
      ].join('\r\n')
    );

    expect(tracker.onlinePlayers).toEqual(['Steve', 'Alex']);
  });

  test('行の途中で分割された出力は改行が届いてから反映する', async () => {
    const { tracker, notified } = setup();

    await tracker.push(`${headers.vanilla}Steve joi`);
    expect(tracker.onlinePlayers).toEqual([]);

    await tracker.push('ned the game\n');
    expect(tracker.onlinePlayers).toEqual(['Steve']);
    expect(notified).toEqual([['Steve']]);
  });

  test('標準エラー出力の断片は標準出力の断片と混ざらない', async () => {
    const { tracker } = setup();

    await tracker.push(`${headers.legacy}Steve joi`, true);
    await tracker.push(`${headers.vanilla}some log\n`);
    await tracker.push('ned the game\n', true);

    expect(tracker.onlinePlayers).toEqual(['Steve']);
  });

  test('色付きの出力でエスケープシーケンスが出力の区切りをまたいでも判定できる', async () => {
    const { tracker } = setup();

    await tracker.push('\u001b[3');
    await tracker.push(`2m${headers.paper}Steve joined the game\u001b[0m\n`);

    expect(tracker.onlinePlayers).toEqual(['Steve']);
  });

  test('同じ入退室に対して複数のログが出力されても通知は1回にまとめる', async () => {
    const { tracker, notified } = setup();

    await tracker.push(
      `${headers.vanilla}Steve[/127.0.0.1:52596] logged in with entity id 1 at (0.0, 64.0, 0.0)\n` +
        `${headers.vanilla}Steve joined the game\n`
    );
    await tracker.push(
      `${headers.vanilla}Steve lost connection: Disconnected\n` +
        `${headers.vanilla}Steve left the game\n`
    );

    expect(notified).toEqual([['Steve'], []]);
  });

  test('プレイヤー名の大文字小文字が異なっていても同一プレイヤーとして扱う', async () => {
    const { tracker } = setup();

    await tracker.push(`${headers.vanilla}Steve joined the game\n`);
    await tracker.push(`${headers.vanilla}steve left the game\n`);

    expect(tracker.onlinePlayers).toEqual([]);
  });

  test('参加していないプレイヤーの退出では通知しない', async () => {
    const { tracker, notified } = setup();

    await tracker.push(`${headers.vanilla}Steve left the game\n`);

    expect(notified).toEqual([]);
  });

  test('リセットすると参加中のプレイヤーがいなくなったことを通知する', async () => {
    const { tracker, notified } = setup();

    await tracker.push(`${headers.vanilla}Steve joined the game\n`);
    await tracker.reset();

    expect(tracker.onlinePlayers).toEqual([]);
    expect(notified).toEqual([['Steve'], []]);
  });

  test('参加中のプレイヤーがいない状態でリセットしても通知しない', async () => {
    const { tracker, notified } = setup();

    await tracker.reset();

    expect(notified).toEqual([]);
  });
});
