import { NewType } from '../util/type/newtype';
import { DatapackMeta } from './datapack';
import { IpAdress } from './ipadress';
import { Mod } from './mod';
import { OpLevel, PlayerName, PlayerUUID } from './player';
import { Plugin } from './plugin';
import { RuntimeSettings } from './runtime';
import { UnixMillisec } from './time';
import { McTimestamp } from './timestamp';
import { Version } from './version';

export type WorldName = NewType<string, 'WorldName'>;

export type LocalWorldContainer = {
  readonly containerType: 'local';
  readonly path: string;
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

export type OpPlayer = {
  uuid: PlayerUUID;
  name: PlayerName;
  level: OpLevel;
  bypassesPlayerLimit: boolean;
};

export type World = {
  /** ワールドの保存コンテナ */
  readonly container: WorldContainer;

  /** ワールド名 */
  readonly name: WorldName;

  /** 起動中フラグ */
  using?: boolean;

  /** eula同意フラグ */
  eula?: boolean;

  /** バージョン情報 */
  version?: Version;

  /** データパック */
  datapack: DatapackMeta[];

  /** プラグイン */
  plugin: Plugin[];

  /** Mod */
  mod: Mod[];

  /** メモリ等ランタイムの設定 */
  runtime?: RuntimeSettings;

  /** whitelist / op に登録せれているプレイヤー */
  players: [];

  /** banされたプレイヤー */
  bannedPlayers: BannedPlayer[];

  /** banされたip */
  bannedIps: BannedIp[];

  /** 最終起動時のデータ */
  readonly last?: {
    /** 最後に起動した時刻 */
    readonly time: UnixMillisec;

    /** 最後に起動したサーバー主 */
    readonly user?: PlayerName;

    /** 最後に起動したバージョン */
    readonly version: Version;
  };
};
