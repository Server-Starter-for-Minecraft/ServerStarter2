import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { formatUUID } from 'app/src-electron/tools/uuid';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { EXPIRATION_SPAN, getPlayerCache, pushPlayerCache } from './cache';
import { searchPlayerFromName, searchPlayerFromUUID } from './search';

/** 名前またはUUIDからプレイヤーを取得 (キャッシュに存在する場合高速) */
export async function getPlayer(
  nameOrUuid: string,
  mode: 'name' | 'uuid' | 'auto'
): Promise<Failable<Player>> {
  switch (mode) {
    case 'name':
      if (!isName(nameOrUuid)) {
        return errorMessage.value.playerName({
          value: nameOrUuid,
        });
      }
      return await getPlayerFromName(nameOrUuid);
    case 'uuid':
      if (!isUUID(nameOrUuid)) {
        return errorMessage.value.playerUUID({
          value: nameOrUuid,
        });
      }
      return await getPlayerFromUUID(nameOrUuid);
    case 'auto':
      if (isName(nameOrUuid)) return await getPlayerFromName(nameOrUuid);

      // autoの場合のみ 0-0-0-0-0 のような短縮UUIDやハイフンのないUUIDを許可する
      const uuid = formatUUID<PlayerUUID>(nameOrUuid);
      if (isError(uuid)) {
        return errorMessage.value.playerNameOrUUID({
          value: nameOrUuid,
        });
      }

      return await getPlayerFromUUID(uuid);
  }
}

function isName(name: string): boolean {
  return name.match(/^[a-zA-Z0-9_]{2,16}$/gm) !== null;
}

function isUUID(name: string): name is PlayerUUID {
  return (
    name.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm
    ) !== null
  );
}

/** 名前からプレイヤーを取得 (キャッシュに存在する場合高速) */
export async function getPlayerFromName(
  name: string
): Promise<Failable<Player>> {
  const cache = await getPlayerCache();
  const cacheValue = Object.values(cache).find(
    (x) => x.name.toLocaleLowerCase() == name.toLocaleLowerCase()
  );
  if (cacheValue !== undefined) {
    // 最後の検索から一定時間が立っていた場合再検索する(待機しない)
    if (
      getCurrentTimestamp() + EXPIRATION_SPAN >
      cacheValue.expire + RE_SERACH_SPAN
    )
      serchAndPushName(name);

    return cacheValue;
  }
  return await serchAndPushName(name);
}

// 再検索までの時間(10日)
const RE_SERACH_SPAN = 1000 * 60 * 60 * 24 * 10;

/** UUIDからプレイヤーを取得 (キャッシュに存在する場合高速) */
export async function getPlayerFromUUID(
  uuid: PlayerUUID
): Promise<Failable<Player>> {
  const cache = await getPlayerCache();
  const cacheValue = cache[uuid];
  if (cacheValue !== undefined) {
    // 最後の検索から一定時間(10日)が経っていた場合再検索する(待機しない)
    if (
      getCurrentTimestamp() + EXPIRATION_SPAN >
      cacheValue.expire + RE_SERACH_SPAN
    )
      serchAndPushUUID(uuid);

    return cacheValue;
  }
  return await serchAndPushUUID(uuid);
}

// プレイヤーを検索してキャッシュを更新
async function serchAndPushUUID(uuid: PlayerUUID) {
  const result = await searchPlayerFromUUID(uuid);
  if (isValid(result)) pushPlayerCache(result);
  return result;
}

// プレイヤーを検索してキャッシュを更新
async function serchAndPushName(name: string) {
  const result = await searchPlayerFromName(name);
  if (isValid(result)) pushPlayerCache(result);
  return result;
}
