import { Path } from 'app/src-electron/util/path';
import { Ops, serverOpsFile } from '../files/ops';
import { Whitelist, serverWhitelistFile } from '../files/whitelist';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';

export async function loadPlayers(serverPath: Path) {
  const [ops, whitelist] = await Promise.all([
    serverOpsFile.load(serverPath),
    serverWhitelistFile.load(serverPath),
  ]);

  // opsとwhitelistが両方読み込めた場合のみplayersを有効化
  if (isValid(ops) && isValid(whitelist)) {
    return toPlayers(ops, whitelist);
  }

  if (isError(ops)) {
    return errorMessage.data.path.invalidContent.invalidOpsJson({
      type: 'file',
      path: serverOpsFile.path(serverPath).path,
    });
  }

  return errorMessage.data.path.invalidContent.invalidWhitelistJson({
    type: 'file',
    path: serverWhitelistFile.path(serverPath).path,
  });
}

function toPlayers(ops: Ops, whitelist: Whitelist): PlayerSetting[] {
  const map: Record<PlayerUUID, PlayerSetting> = {};

  whitelist.forEach(({ uuid, name }) => (map[uuid] = { uuid, name }));

  ops.forEach(
    ({ uuid, name, level, bypassesPlayerLimit }) =>
      (map[uuid] = {
        uuid,
        name,
        op: {
          level,
          bypassesPlayerLimit,
        },
      })
  );

  return Object.values(map);
}

function fromPlayers(players: PlayerSetting[]): [Ops, Whitelist] {
  const whitelist: Whitelist = [];
  const ops: Ops = [];

  players.forEach(({ uuid, name, op }) => {
    whitelist.push({ uuid, name });
    if (op !== undefined) {
      ops.push({ uuid, name, ...op });
    }
  });

  return [ops, whitelist];
}
