import { OpLevel, PlayerSetting } from 'src-electron/schema/player';
import { Ops } from '../world/settings/ops';
import { Whitelist } from '../world/settings/whitelist';

/**
 * PlayerSetting[]からOpsとWhitelistを構成
 */
export function constructOpsAndWhitelist(players: PlayerSetting[]) {
  const ops: Ops = [];
  const whitelist: Whitelist = [];
  players.forEach((player) => {
    if (player.op !== undefined) {
      ops.push({
        bypassesPlayerLimit: player.op.bypassesPlayerLimit,
        level: player.op.level,
        name: player.name,
        uuid: player.uuid,
      });
    }

    whitelist.push({
      name: player.name,
      uuid: player.uuid,
    });
  });

  return { ops, whitelist };
}

/**
 * OpsとWhitelistからPlayerSetting[]を構成
 */
export function constructPleyerSettings({
  ops,
  whitelist,
}: {
  ops: Ops;
  whitelist: Whitelist;
}): PlayerSetting[] {
  const playersRecord: Record<string, PlayerSetting> = {};

  whitelist.forEach((listitem) => {
    playersRecord[listitem.uuid] = {
      name: listitem.name,
      uuid: listitem.uuid,
    };
  });

  ops.forEach((op) => {
    playersRecord[op.uuid] = {
      name: op.name,
      uuid: op.uuid,
      op: {
        level: op.level,
        bypassesPlayerLimit: op.bypassesPlayerLimit,
      },
    };
  });

  return Object.values(playersRecord);
}

type PlayerDiff = {
  whitelist: {
    append: string[];
    remove: string[];
  };
  op: { before: 0 | OpLevel; after: 0 | OpLevel; uuid: string }[];
};

/** PlayerSettingの差分を取得 */
export function getPlayerSettingDiff(
  before: PlayerSetting[],
  after: PlayerSetting[]
): PlayerDiff {
  const result: PlayerDiff = {
    whitelist: { append: [], remove: [] },
    op: [],
  };

  const beforeMap = Object.fromEntries(before.map((x) => [x.uuid, x]));
  const afterMap = Object.fromEntries(after.map((x) => [x.uuid, x]));

  for (const beforeItem of before) {
    const afterItem = afterMap[beforeItem.uuid];
    if (afterItem === undefined) {
      // beforeにあってafterにない
      // whitelistから削除
      result.whitelist.remove.push(beforeItem.uuid);
      if (beforeItem.op !== undefined) {
        // opから削除
        result.op.push({
          uuid: beforeItem.uuid,
          before: beforeItem.op.level,
          after: 0,
        });
      }
    } else {
      // beforeにもafterにもある
      const beforeLevel = beforeItem.op?.level ?? 0;
      const afterLevel = afterItem.op?.level ?? 0;
      if (beforeLevel !== afterLevel) {
        result.op.push({
          uuid: beforeItem.uuid,
          before: beforeLevel,
          after: afterLevel,
        });
      }
    }
  }

  for (const afterItem of after) {
    const beforeItem = beforeMap[afterItem.uuid];
    if (beforeItem === undefined) {
      // afterにあってbeforeにない
      // whitelistに追加
      result.whitelist.append.push(afterItem.uuid);
      if (afterItem.op !== undefined) {
        // opに追加
        result.op.push({
          uuid: afterItem.uuid,
          before: 0,
          after: afterItem.op.level,
        });
      }
    }
  }
  return result;
}
