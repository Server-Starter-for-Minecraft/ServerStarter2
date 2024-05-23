import { DatapackDomain } from './datapack';
import { IpAdress } from './ipadress';
import { ModDomain } from './mod';
import { OpLevel, PlayerUUID } from './player';
import { PluginDomain } from './plugin';
import { RuntimeSettings } from './runtime';
import { McTimestamp } from './timestamp';
import { VersionDomain } from './version';

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

export type WorldDomain = {
  // ワールドの情報
  // バージョン
  // mod
  // 保存日時
  // ロック状態 etc...

  /** 起動中フラグ */
  using: boolean;

  /** 最終サーバー主 */
  laseUser?: string;

  /** eula同意フラグ */
  eula: boolean;

  /** バージョン情報 */
  version: VersionDomain;

  /** データパック */
  datapack: DatapackDomain[];

  /** データパック */
  plugin: PluginDomain[];

  /** Mod */
  mod: ModDomain[];

  /** メモリ等ランタイムの設定 */
  runtime: RuntimeSettings;

  /** whitelist / op に登録せれているプレイヤー */
  players: { uuid: PlayerUUID; op: OpLevel }[];

  /** banされたプレイヤー */
  bannedPlayers: BannedPlayer[];

  /** banされたip */
  bannedIps: BannedIp[];
};
