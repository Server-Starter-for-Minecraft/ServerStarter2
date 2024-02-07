import { fixArray, ArrayFixMode } from '../../base/fixer/array';
import { fixObject } from '../../base/fixer/object';
import { fixString } from '../../base/fixer/primitive';
import { RecordFixMode, fixRecord } from '../../base/fixer/record';
import { fixUUID } from '../../base/fixer/regex';

/** システムのプレイヤーグループ設定 */
export type PlayerGroup$1 = {
  /** グループ名 */
  name: string;
  /** グループのカラー(#入りコード) */
  color: string;
  /** 所属するプレイヤーのUUIDのリスト */
  players: string[];
};

export const PlayerGroup$1 = fixObject<PlayerGroup$1>({
  name: fixString,
  color: fixString,
  players: fixArray(fixUUID, ArrayFixMode.Skip),
});

export type PlayerSettings$1 = {
  groups: { [name: string]: PlayerGroup$1 };
  players: string[];
};

export const defaultPlayerSettings$1 = {
  groups: {},
  players: [],
};

export const PlayerSettings$1 = fixObject<PlayerSettings$1>({
  groups: fixRecord(PlayerGroup$1, RecordFixMode.Skip).default({}),
  players: fixArray(fixUUID, ArrayFixMode.Skip).default([]),
}).default(defaultPlayerSettings$1);
