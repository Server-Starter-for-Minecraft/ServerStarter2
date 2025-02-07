import { z } from 'zod';
import { objValueMap } from 'app/src-public/scripts/obj/objmap';

const PORT_MAX = 2 ** 16 - 2;

export const StringServerPropertyAnnotation = z.object({
  type: z.literal('string'),
  default: z.string(),
  enum: z.string().array().optional(),
});
export type StringServerPropertyAnnotation = z.infer<
  typeof StringServerPropertyAnnotation
>;

export const BooleanServerPropertyAnnotation = z.object({
  type: z.literal('boolean'),
  default: z.boolean(),
});
export type BooleanServerPropertyAnnotation = z.infer<
  typeof BooleanServerPropertyAnnotation
>;

export const NumberServerPropertyAnnotation = z.object({
  type: z.literal('number'),
  default: z.number(),

  /** value % step == 0 */
  step: z.number().optional(),

  /** min <= value <= max */
  min: z.number().optional(),
  max: z.number().optional(),
});
export type NumberServerPropertyAnnotation = z.infer<
  typeof NumberServerPropertyAnnotation
>;

export const ServerPropertyAnnotation = StringServerPropertyAnnotation.or(
  BooleanServerPropertyAnnotation.or(NumberServerPropertyAnnotation)
);
export type ServerPropertyAnnotation = z.infer<typeof ServerPropertyAnnotation>;

/** サーバープロパティのアノテーション */
export const ServerPropertiesAnnotation = z
  .record(ServerPropertyAnnotation)
  .default({
    'accepts-transfers': { type: 'boolean', default: false },

    'allow-flight': { type: 'boolean', default: false },

    'allow-nether': { type: 'boolean', default: true },

    'broadcast-console-to-ops': { type: 'boolean', default: true },

    'broadcast-rcon-to-ops': { type: 'boolean', default: true },

    difficulty: {
      type: 'string',
      default: 'easy',
      enum: ['peaceful', 'easy', 'normal', 'hard'],
    },

    'enable-command-block': { type: 'boolean', default: false },

    'enable-jmx-monitoring': { type: 'boolean', default: false },

    'enable-rcon': { type: 'boolean', default: false },

    'enable-status': { type: 'boolean', default: true },

    'enable-query': { type: 'boolean', default: false },

    'enforce-secure-profile': { type: 'boolean', default: true },

    'enforce-whitelist': { type: 'boolean', default: false },

    'entity-broadcast-range-percentage': {
      type: 'number',
      default: 100,
      min: 0,
      max: 500,
    },

    'force-gamemode': { type: 'boolean', default: false },

    'function-permission-level': { type: 'number', default: 2, min: 1, max: 4 },

    gamemode: {
      type: 'string',
      default: 'survival',
      enum: ['survival', 'creative', 'adventure', 'spectator'],
    },

    'generate-structures': { type: 'boolean', default: true },

    'generator-settings': { type: 'string', default: '{}' },

    hardcore: { type: 'boolean', default: false },

    'hide-online-players': { type: 'boolean', default: false },

    'initial-disabled-packs': { type: 'string', default: '' },

    'initial-enabled-packs': { type: 'string', default: 'vanilla' },

    // 自動設定のため削除
    // 'level-name': { type: 'string', default: '' },

    'level-seed': { type: 'string', default: '' },

    'level-type': {
      type: 'string',
      default: 'default',
      enum: ['default', 'flat', 'largeBiomes', 'amplified', 'buffet'],
    },

    'log-ips': { type: 'boolean', default: true },

    // legacy?
    'max-build-height': { type: 'number', default: 256, step: 8 },

    'max-chained-neighbor-updates': { type: 'number', default: 1000000 },

    'max-players': { type: 'number', default: 20, min: 0, max: 2 ** 31 - 1 },

    'max-tick-time': {
      type: 'number',
      default: 60000,
      min: 0,
      max: 2 ** 63 - 1,
    },

    'max-world-size': {
      type: 'number',
      default: 29999984,
      min: 1,
      max: 29999984,
    },

    motd: { type: 'string', default: 'A Minecraft Server' },

    'network-compression-threshold': { type: 'number', default: 256, min: -1 },

    'online-mode': { type: 'boolean', default: true },

    'op-permission-level': { type: 'number', default: 4, min: 1, max: 4 },

    'player-idle-timeout': { type: 'number', default: 0, min: 0 },

    'prevent-proxy-connections': { type: 'boolean', default: false },

    'previews-chat': { type: 'boolean', default: false },

    pvp: { type: 'boolean', default: true },

    'query.port': { type: 'number', default: 25565, min: 1, max: PORT_MAX },

    'rate-limit': { type: 'number', default: 0, min: 0 },

    'rcon.password': { type: 'string', default: '' },

    'rcon.port': { type: 'number', default: 25575, min: 1, max: PORT_MAX },

    'region-file-compression': {
      type: 'string',
      default: 'deflate',
      enum: ['deflate', 'lz4', 'none'],
    },

    'resource-pack': { type: 'string', default: '' },

    'resource-pack-id': { type: 'string', default: '' },

    'resource-pack-prompt': { type: 'string', default: '' },

    'resource-pack-sha1': { type: 'string', default: '' },

    'require-resource-pack': { type: 'boolean', default: false },

    'server-ip': { type: 'string', default: '' },

    'server-port': { type: 'number', default: 25565, min: 1, max: PORT_MAX },

    'simulation-distance': { type: 'number', default: 10, min: 3, max: 32 },

    'snooper-enabled': { type: 'boolean', default: true },

    'spawn-animals': { type: 'boolean', default: true },

    'spawn-monsters': { type: 'boolean', default: true },

    'spawn-npcs': { type: 'boolean', default: true },

    'spawn-protection': { type: 'number', default: 16, min: 0 },

    'sync-chunk-writes': { type: 'boolean', default: true },

    'text-filtering-config': { type: 'string', default: '' },

    'use-native-transport': { type: 'boolean', default: true },

    'view-distance': { type: 'number', default: 10, min: 2, max: 32 },

    'white-list': { type: 'boolean', default: false },
  });
export type ServerPropertiesAnnotation = z.infer<
  typeof ServerPropertiesAnnotation
>;

/** サーバープロパティのデータ */
export const ServerProperties = z
  .record(z.string().or(z.number().or(z.boolean())))
  .default(objValueMap(ServerPropertiesAnnotation.parse({}), (x) => x.default));
export type ServerProperties = z.infer<typeof ServerProperties>;
