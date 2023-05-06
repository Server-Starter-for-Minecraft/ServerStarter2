import { PlayerSetting } from 'src-electron/schema/player';
import { Ops } from './files/ops';
import { Whitelist } from './files/whitelist';

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
