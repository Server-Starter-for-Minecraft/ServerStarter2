import { z } from 'zod';
import {
  ImageURI,
  PlayerUUID,
  Timestamp,
} from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { ignoreError } from 'app/src-electron/util/error/ignore';
import {
  getCurrentTimestamp,
  toTimestamp,
} from 'app/src-electron/util/timestamp';
import { cachePath } from '../const';
import { sourceLoggers } from '../sourceLogger';

export const PlayerCacheRecord = z.object({
  uuid: PlayerUUID,
  name: z.string(),
  avatar: ImageURI,
  avatar_overlay: ImageURI,
  expire: Timestamp,
});
export type PlayerCacheRecord = z.infer<typeof PlayerCacheRecord>;

export const PlayerCache = z.record(z.string(), PlayerCacheRecord);
export type PlayerCache = z.infer<typeof PlayerCache>;

const PLAYER_CACHE_PATH = cachePath.child('player.json');

let player_cache: undefined | PlayerCache = undefined;

/** 期限の切れたレコードを削除 */
function expirePlayers(cache: PlayerCache): PlayerCache {
  const timestamp = getCurrentTimestamp();
  return Object.fromEntries(
    Object.entries(cache).filter(([, v]) => v.expire > timestamp)
  );
}

/** PlayerCacheを取得 */
export async function getPlayerCache() {
  if (player_cache !== undefined) return player_cache;
  const player_cache_value = await PLAYER_CACHE_PATH.readJson(PlayerCache);

  let result: PlayerCache = {};
  if (isValid(player_cache_value)) {
    const _result = PlayerCache.safeParse(player_cache_value);
    if (_result.success) {
      result = _result.data;
    }
  } else {
    ignoreError(
      player_cache_value,
      'キャッシュが無い・読み込めない場合は，空のキャッシュから始める'
    );
  }

  result = expirePlayers(result);

  await setPlayerCache(result);

  player_cache = result;

  return result;
}

// 有効期限(180日)
export const EXPIRATION_SPAN = 1000 * 60 * 60 * 24 * 180;

/**
 * PlayerCacheにレコードを追加
 * 既に存在する場合expireを延長して上書き
 */
export async function pushPlayerCache(player: Player) {
  const cache = await getPlayerCache();

  const record: PlayerCacheRecord = {
    ...player,
    expire: toTimestamp(new Date(getCurrentTimestamp() + EXPIRATION_SPAN)),
  };

  cache[player.uuid] = record;

  await setPlayerCache(cache);
}

/**
 * プレイヤー情報をキャッシュに登録する
 *
 * キャッシュへの登録処理でエラーが出てもユーザーには問題がないため，エラーは返さずにログに残す
 */
async function setPlayerCache(cache: PlayerCache) {
  const written = await PLAYER_CACHE_PATH.writeJson(cache);
  if (isError(written)) sourceLoggers().player.cache().warn(written);
}
