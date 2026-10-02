import { isValid } from 'app/src-public/scripts/error';
import { Failable } from 'app/src-electron/schema/error';
import { Player, PlayerSetting } from 'app/src-electron/schema/player';
import { WorldEdited } from 'app/src-electron/schema/world';

/**
 * サーバーに参加したプレイヤーのうち，ワールドのプレイヤー一覧(ホワイトリスト)に登録すべきプレイヤーを取得する
 *
 * オフラインモード(`online-mode=false`)のサーバーでは，プレイヤー名から取得できるUUIDが
 * サーバーで使用されるUUIDと一致しないため，登録対象としない
 * (BungeeCord / Velocity 等のプロキシ配下のサーバーも`online-mode=false`となるため登録対象外となる)
 *
 * @param world 登録先のワールド
 * @param joinedNames サーバーに参加したプレイヤー名一覧
 * @param fetchPlayer プレイヤー名からプレイヤー情報を取得する (取得に失敗したプレイヤーは登録対象としない)
 * @returns 未登録のプレイヤー一覧
 */
export async function findPlayersToRegister(
  world: Pick<WorldEdited, 'players' | 'properties'>,
  joinedNames: string[],
  fetchPlayer: (name: string) => Promise<Failable<Player>>
): Promise<PlayerSetting[]> {
  const registered = world.players;
  if (!isValid(registered)) return [];
  if (isValid(world.properties) && world.properties['online-mode'] === false) {
    return [];
  }

  // Minecraftのユーザー名は大文字小文字を区別しないため，区別せずに未登録のプレイヤーを抽出する
  const registeredNames = new Set(registered.map((p) => p.name.toLowerCase()));
  const unregistered = joinedNames.filter(
    (n) => !registeredNames.has(n.toLowerCase())
  );
  if (unregistered.length === 0) return [];

  // 一部のプレイヤーの取得処理が失敗しても，取得できたプレイヤーは登録対象とする
  const fetched = (await Promise.allSettled(unregistered.map(fetchPlayer)))
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter(isValid);

  // 名前変更等で別名から同一プレイヤーが取得された場合に備え，UUIDで重複を除外する
  const result: PlayerSetting[] = [];
  fetched.forEach((p) => {
    const isDuplicated = [...registered, ...result].some(
      (r) => r.uuid === p.uuid
    );
    if (!isDuplicated) result.push({ name: p.name, uuid: p.uuid });
  });
  return result;
}
