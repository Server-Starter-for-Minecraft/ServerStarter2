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
