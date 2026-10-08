import { describe, expect, test } from 'vitest';
import { ImageURI, PlayerUUID } from 'app/src-electron/schema/brands';
import { ErrorMessage, Failable } from 'app/src-electron/schema/error';
import { Player, PlayerSetting } from 'app/src-electron/schema/player';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { findPlayersToRegister } from './findPlayersToRegister';

/** テスト用のプレイヤー情報を生成する */
function player(name: string, uuidSuffix: string): Player {
  return {
    name,
    uuid: PlayerUUID.parse(
      `01234567-89ab-cdef-0123-${uuidSuffix.padStart(12, '0')}`
    ),
    avatar: ImageURI.parse(''),
    avatar_overlay: ImageURI.parse(''),
  };
}

const steve = player('Steve', '1');
const alex = player('Alex', '2');

/** 取得に失敗した場合のエラー */
function notFound(name: string) {
  return {
    type: 'error',
    level: 'error',
    key: 'value.playerName',
    arg: { value: name },
  } as ErrorMessage;
}

/** Mojangに登録されているプレイヤーの一覧を模したプレイヤー情報の取得関数 */
function fetcher(...registered: Player[]) {
  return async (name: string): Promise<Failable<Player>> =>
    registered.find((p) => p.name.toLowerCase() === name.toLowerCase()) ??
    notFound(name);
}

/** 登録先のワールドを生成する */
function world(
  players: PlayerSetting[] | ErrorMessage,
  onlineMode: boolean = true
) {
  return {
    players,
    properties: { 'online-mode': onlineMode } as ServerProperties,
  };
}

describe('findPlayersToRegister', () => {
  test('未登録のプレイヤーが参加した場合は登録対象とする', async () => {
    const result = await findPlayersToRegister(
      world([]),
      ['Steve'],
      fetcher(steve)
    );

    expect(result).toEqual([{ name: 'Steve', uuid: steve.uuid }]);
  });

  test('登録済みのプレイヤーは登録対象としない (名前の大文字小文字は区別しない)', async () => {
    const registered: PlayerSetting[] = [{ name: 'Steve', uuid: steve.uuid }];

    const result = await findPlayersToRegister(
      world(registered),
      ['steve', 'Alex'],
      fetcher(steve, alex)
    );

    expect(result.map((p) => p.name)).toEqual(['Alex']);
  });

  test('名前変更等で登録済みのプレイヤーと同一のプレイヤーが取得された場合は登録対象としない', async () => {
    const registered: PlayerSetting[] = [{ name: 'OldName', uuid: steve.uuid }];

    const result = await findPlayersToRegister(
      world(registered),
      ['Steve'],
      fetcher(steve)
    );

    expect(result).toEqual([]);
  });

  test('異なる名前から同一プレイヤーが取得された場合は1人として登録対象とする', async () => {
    // 旧名と現在の名前の両方でログに出力された状況 (Mojang APIは旧名でも現在のプレイヤーを返す)
    const result = await findPlayersToRegister(
      world([]),
      ['OldName', 'Steve'],
      async () => steve
    );

    expect(result).toEqual([{ name: 'Steve', uuid: steve.uuid }]);
  });

  test('プレイヤー情報を取得できないプレイヤーは登録対象としない', async () => {
    const result = await findPlayersToRegister(
      world([]),
      ['UnknownPlayer', 'Alex'],
      fetcher(alex)
    );

    expect(result.map((p) => p.name)).toEqual(['Alex']);
  });

  test('プレイヤー情報の取得処理が例外で失敗しても他のプレイヤーは登録対象とする', async () => {
    const unstableFetcher = async (name: string) => {
      if (name === 'Steve') throw new Error('IPC failed');
      return fetcher(alex)(name);
    };

    const result = await findPlayersToRegister(
      world([]),
      ['Steve', 'Alex'],
      unstableFetcher
    );

    expect(result.map((p) => p.name)).toEqual(['Alex']);
  });

  test('オフラインモードのサーバーではプレイヤーを登録対象としない', async () => {
    const result = await findPlayersToRegister(
      world([], false),
      ['Steve'],
      fetcher(steve)
    );

    expect(result).toEqual([]);
  });

  test('プレイヤー一覧の読み込みに失敗しているワールドでは登録対象としない', async () => {
    const result = await findPlayersToRegister(
      world(notFound('dummy')),
      ['Steve'],
      fetcher(steve)
    );

    expect(result).toEqual([]);
  });
});
