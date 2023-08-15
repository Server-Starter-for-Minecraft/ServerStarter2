import { isError } from 'app/src-electron/util/error/error';
import { getSystemSettings } from '../stores/system';
import { getPlayerFromUUID } from './main';

let ownerCache: { uuid: string; name: string | undefined } | undefined =
  undefined;

/** システム設定の user.owner に対する名前を取得 */
export async function getSystemOwnerName(): Promise<string | undefined> {
  const sys = await getSystemSettings();
  const uuid = sys.user.owner;

  // uuidに変化がない場合キャッシュを使用
  if (uuid === ownerCache?.uuid) return ownerCache.name;

  const player = await getPlayerFromUUID(sys.user.owner);
  const name = isError(player) ? undefined : player.name;
  ownerCache = { uuid, name };
  return name;
}
