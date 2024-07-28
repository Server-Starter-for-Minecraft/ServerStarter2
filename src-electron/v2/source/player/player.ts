import dayjs from 'dayjs';
import { z } from 'zod';
import {
  PlayerAvatar,
  PlayerName,
  PlayerUUID,
} from '../../schema/player';
import { McTimestamp, McTimestampTemplate } from '../../schema/timestamp';
import { ok, Result } from '../../util/base';
import { Json } from '../../util/binary/json';
import { Path } from '../../util/binary/path';
import { JsonSourceHandler } from '../../util/wrapper/jsonFile';
import { searchPlayerFromName, searchPlayerFromUUID } from './search';

// キャッシュの再取得までの日数
// 現時点の時刻 + EXPIRATION_DATE をキャッシュのexpireに指定する
const EXPIRATION_TIME_DATE = 10;

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

  constructor(cacheDirPath: Path) {
    this.cacheDirPath = cacheDirPath;
    this.playerJsonHandler = JsonSourceHandler.fromPath(
      cacheDirPath.child(PLAYER_FILE_NAME),
      PlayerCache
    );
  }

  /** キャッシュされているプレイヤーデータからサーバーのusercache.jsonを出力する */
  async exportUserCache(path: Path): Promise<Result<void>> {
    const caches = await this.playerJsonHandler.read();

    if (caches.isErr) {
      return path.child(USERCACHE_NAME).writeText('[]');
    } else {
      const userCacheJson = new Json(UserCache);
      return userCacheJson
        .stringify(this.convertPlayer2UserCache(caches.value()))
        .into(path.child(USERCACHE_NAME));
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
        dayjs().add(EXPIRATION_TIME_DATE, 'day').format(McTimestampTemplate)
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
      targetPlayer = await this.fetchPleyerFromName(PlayerName.parse(searchWord));
    }

    // 検索結果を`player.json`に登録する
    const existPlayers = await this.playerJsonHandler.read();
    if (existPlayers.isOk && targetPlayer.isOk) {
      this.playerJsonHandler.write(
        Object.assign(
          existPlayers.value(),
          this.avatar2PlayerCache(targetPlayer.value())
        )
      );
    }

    return targetPlayer;
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
      const target = players.value().find(p => p.uuid === playerUUID);
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
      const target = players.value().find(p => p.name === playerName);
      if (target) {
        return ok(target);
      }
    }

    // 未知のプレイヤーはMinecraft APIに検索をかける
    return searchPlayerFromName(playerName);
  }
}
