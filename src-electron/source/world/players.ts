import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel, PlayerSetting } from 'app/src-electron/schema/player';
import { fromEntries } from 'app/src-electron/util/obj';

/** Opレベルに変更のあるプレイヤーだけを抜き出す */
export function getOpDiff(current: PlayerSetting[], next: PlayerSetting[]) {
  const currentUUIDs = new Set(current.map((x) => x.uuid));
  const nextUUIDs = new Set(next.map((x) => x.uuid));

  const sameMember =
    currentUUIDs.size === nextUUIDs.size &&
    [...currentUUIDs].every((value) => nextUUIDs.has(value));

  const currentMap = fromEntries<Record<PlayerUUID, OpLevel | 0>>(
    current.map((x) => [x.uuid, x.op?.level ?? 0])
  );
  const opPlayers = {
    0: [] as string[],
    1: [] as string[],
    2: [] as string[],
    3: [] as string[],
    4: [] as string[],
  };
  next.forEach((item) => {
    const cur = currentMap[item.uuid];
    const nxt = item.op?.level ?? 0;

    if (cur === undefined && nxt === 0) return;
    if (cur === nxt) return;

    // 権限が下がる場合は一度deopする
    if (cur ?? 0 > nxt ?? 0) opPlayers[0].push(item.name);

    opPlayers[nxt].push(item.name);
  });
  return [opPlayers, sameMember] as const;
}
