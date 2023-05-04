export type Player = {
  name: string;
  uuid: string;
};

export type PlayerGroup = {
  name: string;
  uuid: string;
  players: Player[];
};

export type OpLevel = 1 | 2 | 3 | 4;

export type PlayerSetting = {
  /** プレイヤーの名前 */
  name: string;
  /** プレイヤーのUUID */
  uuid: string;
  /** プレイヤーのop権限レベル */
  op: OpLevel;
  /** プレイヤーがwhitelistに入っているか */
  whitelist: boolean;
};

export type PlayerGroupSetting = {
  /** グループの名前 */
  name: string;
  /** グループのUUID */
  uuid: string;
  /** グループのop権限レベル */
  op: OpLevel;
  /** グループがwhitelistに入っているか */
  whitelist: boolean;
};

/** ワ－ルドごとのプレイヤー/グループと権限の設定 */
export type WorldPlayers = {
  /** ワールドに紐づいたグループとその権限 */
  groups: PlayerGroupSetting[];
  /** ワールドに紐づいたプレイヤーとその権限(手動追加された場合に限る) */
  players: PlayerSetting[];
  /** ワールドに紐づいたプレイヤーの一覧から削除されたプレイヤー */
  removed: Player[];
};
