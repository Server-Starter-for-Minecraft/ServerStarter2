import { isError } from 'app/src-electron/util/error/error';
import { ignoreError } from 'app/src-electron/util/error/ignore';
import { getSystemSettings } from '../stores/system';
import { getPlayerFromUUID } from './main';

let ownerCache:
  { uuid: string | undefined; name: string | undefined } | undefined =
  undefined;

/** システム設定の user.owner に対する名前を取得 */
export async function getSystemOwnerName(): Promise<string | undefined> {
  const sys = await getSystemSettings();
  const uuid = sys.user.owner;

  // uuidに変化がない場合キャッシュを使用
  if (ownerCache && uuid === ownerCache.uuid) return ownerCache.name;

  if (uuid !== undefined) {
    const player = await getPlayerFromUUID(uuid);
    let name: string | undefined;
    if (isError(player)) {
      ignoreError(
        player,
        'オーナーの名前を取得できない場合は名前なしで表示する'
      );
    } else {
      name = player.name;
    }
    ownerCache = { uuid, name };
    return name;
  }
  ownerCache = { uuid, name: undefined };
  return undefined;
}
