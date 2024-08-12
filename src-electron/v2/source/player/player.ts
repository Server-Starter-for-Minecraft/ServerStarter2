import dayjs from 'dayjs';
import { z } from 'zod';
import { PlayerAvatar, PlayerName, PlayerUUID } from '../../schema/player';
import { McTimestamp, McTimestampTemplate } from '../../schema/timestamp';
import { ok, Result } from '../../util/base';
import { Json } from '../../util/binary/json';
import { Path } from '../../util/binary/path';
import { PromiseSpooler } from '../../util/promise/spool';
import { JsonSourceHandler } from '../../util/wrapper/jsonFile';
import { searchPlayerFromName, searchPlayerFromUUID } from './search';

// キャッシュの再取得までの日数
// 現時点の時刻 + EXPIRATION_DATE をキャッシュのexpireに指定する
const EXPIRATION_DATE = 10;

const PLAYER_FILE_NAME = 'player.json';
const PlayerCache = z
  .object({
    expire: McTimestamp,
  })
  .and(PlayerAvatar)
  .array();
type PlayerCache = z.infer<typeof PlayerCache>;

const USERCACHE_NAME = 'usercache.json';
const UserCache = z
  .object({
    name: PlayerName,
    uuid: PlayerUUID,
    expiresOn: McTimestamp,
  })
  .array();
type UserCache = z.infer<typeof UserCache>;

/** プレイヤーの情報をAPIから取得し、キャッシュファイルに保存するクラス */
export class PlayerContainer {
  // プレイヤーキャッシュ用のディレクトリ 名前衝突は気にしなくてよい
  private cacheDirPath: Path;
  private playerJsonHandler: JsonSourceHandler<PlayerCache>;
  private playerJsonSpooler: PromiseSpooler;

  constructor(cacheDirPath: Path) {
    this.cacheDirPath = cacheDirPath;
    this.playerJsonHandler = JsonSourceHandler.fromPath(
      cacheDirPath.child(PLAYER_FILE_NAME),
      PlayerCache
    );
    this.playerJsonSpooler = new PromiseSpooler();
  }

  /** キャッシュされているプレイヤーデータからサーバーのusercache.jsonを出力する */
  async exportUserCache(path: Path): Promise<Result<void>> {
    const caches = await this.playerJsonHandler.read();
    const exportPath = path.child(USERCACHE_NAME);

    if (caches.isErr) {
      return exportPath.writeText('[]');
    } else {
      return exportPath.writeText(
        JSON.stringify(this.convertPlayer2UserCache(caches.value()))
      );
    }
  }

  /** `player.json`の内容から`usercache.json`に書き込む内容を抽出する */
  private convertPlayer2UserCache(players: PlayerCache): UserCache {
    return players.map((p) => {
      return { uuid: p.uuid, name: p.name, expiresOn: p.expire };
    });
  }

  /** サーバーのusercache.jsonを読み込んで、キャッシュに存在しないプレイヤーを追加する */
  async importUserCache(path: Path): Promise<Result<void>> {
    const userCacheJson = new Json(UserCache);
    const uCaches = await path.child(USERCACHE_NAME).into(userCacheJson);
    const caches = await this.playerJsonHandler.read();

    return this.playerJsonHandler.write(
      await this.convertUserCache2Player(
        uCaches.isOk ? uCaches.value() : [],
        caches.isOk ? caches.value() : []
      )
    );
  }

  /**
   * `usercache.json`の内容から`player.json`に書き込む内容を追記する
   */
  private async convertUserCache2Player(
    caches: UserCache,
    players: PlayerCache
  ): Promise<PlayerCache> {
    // `player.json`のうち，有効期限を過ぎたプレイヤーを排除
    const validPlayers = players.filter((p) =>
      dayjs().isBefore(dayjs(p.expire))
    );
    // 新しく登録すべきプレイヤーを抽出
    const registUser = caches.filter(
      (c) => !validPlayers.some((p) => p.uuid === c.uuid)
    );

    await Promise.all(
      registUser.map(async (u) => {
        const avatar = await this.searchPleyer(u.uuid);
        if (avatar.isOk) {
          validPlayers.push(this.avatar2PlayerCache(avatar.value()));
        }
      })
    );

    return validPlayers;
  }

  /** Avatarの情報にExpireプロパティを追加することで，PlayerCacheを返す */
  private avatar2PlayerCache(avatar: PlayerAvatar): PlayerCache[number] {
    return Object.assign(avatar, {
      expire: McTimestamp.parse(
        dayjs().add(EXPIRATION_DATE, 'day').format(McTimestampTemplate)
      ),
    });
  }

  /**
   * 文字列からプレイヤーを取得
   *
   * `0-0-0-0-0`  等UUIDっぽい文字列だったらUUIDとして検索
   * `HELLOWORLD` 等名前っぽい文字列だったら名前として検索
   *
   * キャッシュに存在する場合それを使用
   *
   * 新規プレイヤーの場合はキャッシュへの登録も実施する
   */
  async searchPleyer(searchWord: string): Promise<Result<PlayerAvatar>> {
    const parsedUUID = Result.fromZod(PlayerUUID.safeParse(searchWord));

    let targetPlayer;
    if (parsedUUID.isOk) {
      targetPlayer = await this.fetchPleyerFromUUID(parsedUUID.value());
    } else {
      targetPlayer = await this.fetchPleyerFromName(
        PlayerName.parse(searchWord)
      );
    }

    // 検索結果を`player.json`に登録する
    if (targetPlayer.isOk) {
      await this.registPlayer(targetPlayer.value());
    }

    return targetPlayer;
  }

  /**
   * 指定したプレイヤーを`player.json`に登録しておく
   *
   * 同時に書き込み依頼された場合には１件ずつ登録処理を行う
   */
  private registPlayer(player: PlayerAvatar) {
    return this.playerJsonSpooler.spool(async () => {
      const existPlayers = await this.playerJsonHandler.read();
      await this.playerJsonHandler.write(
        (existPlayers.isOk ? existPlayers.value() : []).concat(
          this.avatar2PlayerCache(player)
        )
      );
    });
  }

  /**
   * UUIDからプレイヤーを取得 (キャッシュに存在する場合それを使用)
   * UUIDは ********-****-****-****-************ の形式のみ許可
   */
  private async fetchPleyerFromUUID(
    playerUUID: PlayerUUID
  ): Promise<Result<PlayerAvatar>> {
    // 探索履歴の一覧を取得
    const players = await this.playerJsonHandler.read();

    // 既に探索履歴がある場合はそのデータを返す
    if (players.isOk) {
      const target = players.value().find((p) => p.uuid === playerUUID);
      if (target) {
        return ok(target);
      }
    }

    // 未知のプレイヤーはMinecraft APIに検索をかける
    return searchPlayerFromUUID(playerUUID);
  }

  /** 名前からプレイヤーを取得 (キャッシュに存在する場合それを使用) */
  private async fetchPleyerFromName(
    playerName: PlayerName
  ): Promise<Result<PlayerAvatar>> {
    // 探索履歴の一覧を取得
    const players = await this.playerJsonHandler.read();

    // 既に探索履歴がある場合はそのデータを返す
    if (players.isOk) {
      const target = players.value().find((p) => p.name === playerName);
      if (target) {
        return ok(target);
      }
    }

    // 未知のプレイヤーはMinecraft APIに検索をかける
    return searchPlayerFromName(playerName);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child('work');
  workPath.emptyDir();
  const cacheFolder = workPath.child('cache');
  const cacheFile = cacheFolder.child(PLAYER_FILE_NAME);
  const worldFolder = workPath.child('anyWorld');

  const players: { name: string; uuid: string }[] = [
    { name: 'CivilTT', uuid: '7aa8d952-5617-4a8c-8f4f-8761999a1f1a' },
    { name: 'txkodo', uuid: 'e19851cc-9493-4875-8d67-493b8474564f' },
  ];

  const container = new PlayerContainer(cacheFolder);
  test.each(players)('searchPlayer ($name)', async ({ name, uuid }) => {
    // remove cache file
    await cacheFile.remove();

    // name -> uuid
    const n2uResult = await container.searchPleyer(name);
    expect(n2uResult.isOk).toBe(true);
    expect(n2uResult.value().uuid).toBe(uuid);

    // name -> uuid
    const u2nResult = await container.searchPleyer(uuid);
    expect(u2nResult.isOk).toBe(true);
    expect(u2nResult.value().name).toBe(name);

    // cache file check
    expect(cacheFile.exists()).toBe(true);
    const json = new Json(PlayerCache);
    const jsonVal = (await cacheFile.into(json)).value()[0];
    expect(jsonVal.name).toBe(name);
    expect(McTimestamp.safeParse(jsonVal.expire).success).toBe(true);
  });

  test('cache -> world (exportUserCache)', async () => {
    // reset test env
    await workPath.remove();

    // set cache
    await Promise.all(players.map((p) => container.searchPleyer(p.uuid)));

    // test function
    const res = await container.exportUserCache(worldFolder);

    // check `usercache.json`
    expect(res.isOk).toBe(true);
    expect(worldFolder.child(USERCACHE_NAME).exists()).toBe(true);
    const targetJson = new Json(UserCache);
    const target = (
      await worldFolder.child(USERCACHE_NAME).into(targetJson)
    ).value();
    expect(
      target.map(({ name, uuid }) => {
        return { name, uuid };
      })
    ).toEqual(expect.arrayContaining(players));
  });

  test('world -> cache (importUserCache)', async () => {
    // reset test env
    await workPath.remove();

    // static value
    const expireTime = McTimestamp.parse(dayjs().format(McTimestampTemplate));

    // set cache in world
    const cacheHandler = JsonSourceHandler.fromPath(
      worldFolder.child(USERCACHE_NAME),
      UserCache
    );
    await cacheHandler.write(
      players.map(({ name, uuid }) => {
        return {
          name: PlayerName.parse(name),
          uuid: PlayerUUID.parse(uuid),
          expiresOn: expireTime,
        };
      })
    );

    // test function
    const res = await container.importUserCache(worldFolder);

    // check `player.json` (Omit `avatar imgs`)
    expect(res.isOk).toBe(true);
    expect(cacheFile.exists()).toBe(true);
    const targetJson = new Json(PlayerCache);
    const target = (await cacheFile.into(targetJson)).value();
    expect(
      target.map(({ name, uuid }) => {
        return { name, uuid };
      })
    ).toEqual(expect.arrayContaining(players));
  });
}
