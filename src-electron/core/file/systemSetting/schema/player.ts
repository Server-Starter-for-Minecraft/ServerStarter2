import { fixArray, ArrayFixMode } from '../../base/fixer/array';
import { fixObject } from '../../base/fixer/object';
import { fixString } from '../../base/fixer/primitive';

export type PlayerSettings$1 = {
  groups: { [name: string]: PlayerGroup$1 };
  players: string[];
};

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
  players: fixArray(fixString, ArrayFixMode.Skip),
});
