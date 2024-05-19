import {
  ImageURI,
  PlayerUUID,
  Timestamp,
} from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import {
  objectFixer,
  recordFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import { isValid } from 'app/src-electron/util/error/error';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { cachePath } from '../const';
import { fixImageURI, fixPlayerUUID, fixTimestamp } from '../fixers/brands';

export type PlayerCacheRecord = {
  uuid: PlayerUUID;
  name: string;
  avatar: ImageURI;
  avatar_overlay: ImageURI;
  expire: Timestamp;
};

export type PlayerCache = Record<PlayerUUID, PlayerCacheRecord>;

const fixPlayerCacheRecord = objectFixer(
  {
    uuid: fixPlayerUUID,
    name: stringFixer(),
    avatar: fixImageURI,
    avatar_overlay: fixImageURI,
    expire: fixTimestamp,
  },
  false
);

const fixPlayerCache = recordFixer(fixPlayerCacheRecord, true);

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
  const player_cache_value = await PLAYER_CACHE_PATH.readJson<PlayerCache>();

  let result: PlayerCache = {};
  if (isValid(player_cache_value)) result = fixPlayerCache(player_cache_value);

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
    expire: (getCurrentTimestamp() + EXPIRATION_SPAN) as Timestamp,
  };

  cache[player.uuid] = record;

  await setPlayerCache(cache);
}

async function setPlayerCache(cache: PlayerCache) {
  await PLAYER_CACHE_PATH.writeJson(cache);
}
