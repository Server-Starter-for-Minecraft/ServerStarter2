import { PlayerAvatar, PlayerName, PlayerUUID } from '../../schema/player';
import { err, Result } from '../../util/base';
import { Path } from '../../util/binary/path';

// 実装後には不要になるコメントがいっぱいあるので、適宜削除してください。

// キャッシュの再取得までのミリ秒
// 現時点の時刻 + EXPIRATION_TIME_MS をキャッシュのexpireに指定する想定
const EXPIRATION_TIME_MS = 1000 * 60 * 60 * 12 * 10;

// 実装はsrc-electron\schema\player.ts参照

/** プレイヤーの情報をAPIから取得し、キャッシュファイルに保存するクラス */
export class PlayerContainer {
  // プレイヤーキャッシュ用のディレクトリ 名前衝突は気にしなくてよい
  private cacheDirPath: Path;

  constructor(cacheDirPath: Path) {
    this.cacheDirPath = cacheDirPath;

    // こんな感じで書けそう (こうじゃなくてもOK)
    // this.nameToUUID  : InfinitMap<PlayerName, PlayerUUID>;
    // this.UUIDToAvatar: InfinitMap<PlayerUUID, PlayerAvatar>;
  }

  /** キャッシュされているプレイヤーデータからサーバーのusercache.jsonを出力する */
  async exportUserCache(path: Path): Promise<Result<void>> {
    return err.error('not_implemanted');
  }

  /** サーバーのusercache.jsonを読み込んで、キャッシュに存在しないプレイヤーを追加する */
  async importUserCache(path: Path): Promise<Result<void>> {
    return err.error('not_implemanted');
  }

  /**
   * 文字列からプレイヤーを取得
   *
   * `0-0-0-0-0`  等UUIDっぽい文字列だったらUUIDとして検索
   * `HELLOWORLD` 等名前っぽい文字列だったら名前として検索
   *
   * (キャッシュに存在する場合それを使用)
   */
  async searchPleyer(serchWord: string): Promise<Result<PlayerAvatar>> {
    return err.error('not_implemanted');
  }

  /**
   * UUIDからプレイヤーを取得 (キャッシュに存在する場合それを使用)
   * UUIDは ********-****-****-****-************ の形式のみ許可
   */
  async fetchPleyerFromUUID(
    playerUUID: PlayerUUID
  ): Promise<Result<PlayerAvatar>> {
    return err.error('not_implemanted');
  }

  /** 名前からプレイヤーを取得 (キャッシュに存在する場合それを使用) */
  async fetchPleyerFromName(
    playerName: PlayerName
  ): Promise<Result<PlayerAvatar>> {
    return err.error('not_implemanted');
  }
}
