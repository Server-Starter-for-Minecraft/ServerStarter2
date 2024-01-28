import { ImageURI, PlayerUUID } from './brands';

/** システムのプレイヤー設定 */
export type Player = {
  /** プレイヤー名 */
  name: string;

  /** プレイヤーのUUID */
  uuid: PlayerUUID;

  /** プレイヤースキンの顔部分の画像 */
  avatar: ImageURI;

  /** プレイヤースキンの顔部分の外側レイヤーの画像 */
  avatar_overlay: ImageURI;
};

/** システムのプレイヤーグループ設定 */
export type PlayerGroup = {
  /** グループ名 */
  name: string;
  /** グループのカラー(#入りコード) */
  color: string;
  /** 所属するプレイヤーのUUIDのリスト */
  players: PlayerUUID[];
};

/** ワールドごとのプレイヤーOPの権限レベル */
export type OpLevel = 1 | 2 | 3 | 4;

export type OpSetting = {
  level: OpLevel;
  bypassesPlayerLimit: boolean;
};

/** ワールドごとのプレイヤー設定 */
export type PlayerSetting = {
  /** プレイヤーのUUID */
  uuid: PlayerUUID;
  /** プレイヤー名 */
  name: string;
  /** プレイヤーのop権限レベル */
  op?: OpSetting;
};
