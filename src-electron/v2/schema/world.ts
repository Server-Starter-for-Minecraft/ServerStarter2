import { z } from 'zod';
import { DatapackMeta } from './datapack';
import { IpAdress } from './ipadress';
import { Mod } from './mod';
import { OpLevel, PlayerName, PlayerUUID } from './player';
import { Plugin } from './plugin';
import { RuntimeSettings } from './runtime';
import { ServerProperties } from './serverproperty';
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

const foreverOrTime = z.union([z.literal('forever'), McTimestamp]);

export const BannedPlayer = z.object({
  uuid: PlayerUUID,
  created: McTimestamp,
  source: z.string(),
  expires: foreverOrTime,
  reason: z.string(),
});
export type BannedPlayer = z.infer<typeof BannedPlayer>;

export const BannedIp = z.object({
  ip: IpAdress,
  created: McTimestamp,
  source: z.string(),
  expires: foreverOrTime,
  reason: z.string(),
});
export type BannedIp = z.infer<typeof BannedIp>;

export const OpPlayer = z.object({
  uuid: PlayerUUID,
  name: PlayerName,
  level: OpLevel,
  bypassesPlayerLimit: z.boolean(),
});
export type OpPlayer = z.infer<typeof OpPlayer>;

export const WhitelistPlayer = z.object({
  uuid: PlayerUUID,
  name: PlayerName,
});
export type WhitelistPlayer = z.infer<typeof WhitelistPlayer>;

export const World = z.object({
  /** 起動中フラグ */
  using: z.boolean().default(false),

  /** バージョン情報 */
  version: Version.default({ type: 'unknown' }),

  /** `server.properties`の情報 */
  properties: ServerProperties.optional(),

  /** データパック */
  datapack: z.array(DatapackMeta).optional(),

  /** プラグイン */
  plugin: z.array(Plugin).optional(),

  /** Mod */
  mod: z.array(Mod).optional(),

  /** メモリ等ランタイムの設定 */
  runtime: RuntimeSettings.optional(),

  /** whitelist / op に登録せれているプレイヤー */
  players: z.array(OpPlayer).optional(),

  /** banされたプレイヤー */
  bannedPlayers: z.array(BannedPlayer).optional(),

  /** banされたip */
  bannedIps: z.array(BannedIp).optional(),

  /** 最終起動時のデータ */
  last: z
    .object({
      /** 最後に起動した時刻 */
      time: UnixMillisec,

      /** 最後に起動したサーバー主 */
      user: PlayerName.optional(),

      /** 最後に起動したバージョン */
      version: Version,
    })
    .optional(),
});

export type World = z.infer<typeof World>;
