import { z } from 'zod';
import { DatapackMeta } from './datapack';
import { IpAdress } from './ipadress';
import { Mod } from './mod';
import { OpLevel, PlayerName, PlayerUUID } from './player';
import { Plugin } from './plugin';
import { RuntimeSettings } from './runtime';
import { UnixMillisec } from './time';
import { McTimestamp } from './timestamp';
import { Version } from './version';

export const WorldName = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .brand('WorldName');
export type WorldName = z.infer<typeof WorldName>;

export const LocalWorldContainer = z.object({
  containerType: z.enum(['local']),
  path: z.string(),
});
export type LocalWorldContainer = z.infer<typeof LocalWorldContainer>;

const WorldContainer = LocalWorldContainer;
export type WorldContainer = z.infer<typeof WorldContainer>;

export const WorldLocation = z.object({
  container: WorldContainer,
  worldName: WorldName,
});
export type WorldLocation = z.infer<typeof WorldLocation>;

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
