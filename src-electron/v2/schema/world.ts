import { NewType } from '../util/type/newtype';
import { DatapackMeta } from './datapack';
import { IpAdress } from './ipadress';
import { Mod } from './mod';
import { OpLevel, PlayerName, PlayerUUID } from './player';
import { Plugin } from './plugin';
import { RuntimeSettings } from './runtime';
import { McTimestamp } from './timestamp';
import { Version } from './version';

export type WorldName = NewType<string, 'WorldName'>;

export type LocalWorldContainer = {
  containerType: 'local';
};

export type WorldContainer = LocalWorldContainer;

export type BannedPlayer = {
  uuid: PlayerUUID;
  created: McTimestamp;
  source: string;
  expires: 'forever' | McTimestamp;
  reason: string;
};

export type BannedIp = {
  ip: IpAdress;
  created: McTimestamp;
  source: string;
  expires: 'forever' | McTimestamp;
  reason: string;
};

export type World = {
  // ワールドの情報
  // バージョン
  // mod
  // 保存日時
  // ロック状態 etc...

  /** ワールドの保存コンテナ */
  container: WorldContainer;

  /** ワールド名 */
  name: WorldName;

  /** 起動中フラグ */
  using?: boolean;

  /** eula同意フラグ */
  eula?: boolean;

  /** バージョン情報 */
  version?: Version;

  /** データパック */
  datapack: DatapackMeta[];

  /** TODO: プラグイン */
  plugin: Plugin[];

  /** TODO: Mod */
  mod: Mod[];

  /** メモリ等ランタイムの設定 */
  runtime?: RuntimeSettings;

  /** whitelist / op に登録せれているプレイヤー */
  players: { uuid: PlayerUUID; op: OpLevel }[];

  /** banされたプレイヤー */
  bannedPlayers: BannedPlayer[];

  /** banされたip */
  bannedIps: BannedIp[];

  /** 最終起動時のデータ */
  last?: {
    /** 最後に起動したサーバー主 */
    user?: PlayerName;

    /** 最後に起動したバージョン */
    version?: PlayerName;
  };
};
