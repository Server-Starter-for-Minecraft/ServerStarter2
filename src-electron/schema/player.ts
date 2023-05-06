export type Player = {
  name: string;
  uuid: string;
};

export type PlayerGroup = {
  name: string;
  players: Player[];
};

export type OpLevel = 1 | 2 | 3 | 4;

export type OpSetting = {
  level: OpLevel;
  bypassesPlayerLimit: boolean;
};

export type PlayerSetting = {
  /** プレイヤーの名前 */
  name: string;
  /** プレイヤーのUUID */
  uuid: string;
  /** プレイヤーのop権限レベル */
  op?: OpSetting;
};
