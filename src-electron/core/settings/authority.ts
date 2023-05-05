import {
  OpSetting,
  PlayerSetting,
  WorldAuthority,
} from 'src-electron/schema/player';
import { Ops } from './ops';
import { fix } from 'src-electron/util/fix';
import { systemSettings } from '../stores/system';
import { Player } from 'src-electron/schema/player';
import { Whitelist } from './whitelist';

function getAllPlayers(authority: WorldAuthority) {
  const groupSettings = systemSettings.get('player').groups;
  const result: Record<string, PlayerSetting> = {};

  /** プレイヤー一覧からプレイヤーを削除 */
  function removePlayer(player: Player) {
    delete result[player.uuid];
  }

  /** プレイヤー一覧にプレイヤーを追加 既に存在する場合更新 */
  function addPlayer(player: PlayerSetting, force: boolean) {
    const record = result[player.uuid];
    if (force || record === undefined) {
      // 未登録 or forceの場合はレコードを上書き
      result[player.uuid] = player;
      return;
    }

    // op権限を高いほうに更新
    if (record.op !== undefined) {
      if (player.op !== undefined && record.op < player.op) {
        record.op = player.op;
      }
    } else record.op = player.op;

    // whitelistはtrueを優先
    if (record.whitelist === false) record.whitelist = player.whitelist;
  }

  // 登録されているグループの全メンバーの情報をマージ
  authority.groups.forEach((group) => {
    const members =
      groupSettings.find((g) => g.uuid === group.uuid)?.players ?? [];
    members.forEach((member) => {
      const player: PlayerSetting = {
        ...member,
        op: group.op,
        whitelist: group.whitelist,
      };
      addPlayer(player, false);
    });
  });

  // 手動設定のプレーヤーのデータでレコードを上書き
  authority.players.forEach((player) => addPlayer(player, true));

  // removedなプレイヤーを削除
  authority.removed.forEach(removePlayer);

  // ワールドで権限が設定された全プレイヤー
  const margedPlayers = Object.values(result);

  return margedPlayers;
}

export function getOpsAndWhitelist(authority: WorldAuthority | undefined) {
  authority = fix<WorldAuthority>(authority, {
    groups: [],
    players: [],
    removed: [],
  });

  const allPlayers = getAllPlayers(authority);

  // OpsとWhitelistを構成
  const ops: Ops = [];
  const whitelist: Whitelist = [];
  allPlayers.forEach((player) => {
    if (player.op !== undefined) {
      ops.push({
        bypassesPlayerLimit: player.op.bypassesPlayerLimit,
        level: player.op.level,
        name: player.name,
        uuid: player.uuid,
      });
    }
    if (player.whitelist) {
      whitelist.push({
        name: player.name,
        uuid: player.uuid,
      });
    }
  });

  return { ops, whitelist };
}

/** サーバー起動後の whitelist/ops の内容を取得して更新 */
export async function updateAuthority(
  authority: WorldAuthority | undefined,
  ops: Ops,
  whitelist: Whitelist
): Promise<WorldAuthority> {
  authority = fix<WorldAuthority>(authority, {
    groups: [],
    players: [],
    removed: [],
  });

  // 権限のある全プレイヤーを取得
  const allPlayers = getAllPlayers(authority);

  const oldPlayerSettings = Object.fromEntries(
    allPlayers.map((p) => [p.uuid, p])
  );

  const oldEditablePlayerRecord = Object.fromEntries(
    authority.players.map((p) => [p.uuid, p])
  );

  const oldRemovedRecord = Object.fromEntries(
    authority.removed.map((p) => [p.uuid, p])
  );

  const newPlayerSettings = constructPlayerSettings(ops, whitelist);

  // 変化前のプレイヤー設定でループ
  Object.values(oldPlayerSettings).forEach((player) => {
    if (newPlayerSettings[player.uuid] === undefined) {
      // Op権限がはく奪された場合

      // 編集可能プレイヤーから削除
      delete oldEditablePlayerRecord[player.uuid];

      // 削除済みプレイヤーに追加
      oldRemovedRecord[player.uuid] = { name: player.name, uuid: player.uuid };
    }
  });

  // 変化後のプレイヤー設定でループ
  Object.values(newPlayerSettings).forEach((player) => {
    const old = oldPlayerSettings[player.uuid];

    // 権限に変化がない場合無視
    if (
      old !== undefined &&
      player.whitelist == old.whitelist &&
      sameop(player.op, old.op)
    ) {
      return;
    }

    // 権限に変化がある場合、編集可能プレイヤーとして登録
    oldEditablePlayerRecord[player.uuid] = player;
    delete oldRemovedRecord[player.uuid];
  });

  return {
    groups: authority.groups,
    players: Object.values(oldEditablePlayerRecord),
    removed: Object.values(oldRemovedRecord),
  };
}

// opの内容が同じかどうかをチェック
function sameop(a: OpSetting | undefined, b: OpSetting | undefined) {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  if (a.bypassesPlayerLimit === b.bypassesPlayerLimit && a.level === b.level)
    return true;
  return false;
}

function constructPlayerSettings(ops: Ops, whitelist: Whitelist) {
  const result: Record<string, PlayerSetting> = {};

  ops.forEach((op) => {
    result[op.uuid] = {
      uuid: op.uuid,
      name: op.name,
      op: { bypassesPlayerLimit: op.bypassesPlayerLimit, level: op.level },
      whitelist: false,
    };
  });

  whitelist.forEach((white) => {
    if (white.uuid in result) {
      result[white.uuid].whitelist = true;
    } else {
      result[white.uuid] = {
        uuid: white.uuid,
        name: white.name,
        whitelist: true,
      };
    }
  });

  return result;
}
