import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel, PlayerSetting } from 'app/src-electron/schema/player';
import { fromEntries } from 'app/src-electron/util/obj';

/** Opレベルに変更のあるプレイヤーだけを抜き出す */
export function getOpDiff(current: PlayerSetting[], next: PlayerSetting[]) {
  const currentMap = fromEntries<Record<PlayerUUID, OpLevel | 0>>(
    current.map((x) => [x.uuid, x.op?.level ?? 0])
  );
  const opPlayers = {
    0: [] as PlayerUUID[],
    1: [] as PlayerUUID[],
    2: [] as PlayerUUID[],
    3: [] as PlayerUUID[],
    4: [] as PlayerUUID[],
  };
  next.forEach((item) => {
    const cur = currentMap[item.uuid];
    const nxt = item.op?.level ?? 0;

    if (cur === undefined && nxt === 0) return;
    if (cur === nxt) return;

    // 権限が下がる場合は一度deopする
    if (cur ?? 0 > nxt ?? 0) opPlayers[0].push(item.uuid);

    opPlayers[nxt].push(item.uuid);
  });
  return opPlayers;
}
