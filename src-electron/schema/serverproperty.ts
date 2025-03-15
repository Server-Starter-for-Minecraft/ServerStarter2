import { z } from 'zod';
import { toEntries } from '../util/obj/obj';

const PORT_MAX = 2 ** 16 - 2;

// z.coerce.boolean() を使うと，'false' を true に変換してしまうので，自前で実装する
const boolSetter = (def: boolean) =>
  z
    .preprocess(
      (txt) =>
        typeof txt === 'string' ? txt.toLowerCase() === 'true' : undefined,
      z.boolean()
    )
    .default(def)
    .catch(def);
const stringSetter = (def: string) => z.string().default(def).catch(def);
const enumSetter = <U extends string, T extends Readonly<[U, ...U[]]>>(
  values: T,
  def: T[number]
) => z.enum(values).default(def).catch(def);
const numberSetter = (
  def: number,
  min?: number,
  max?: number,
  step?: number
) => {
  const checksPattern =
    2 ** 0 * Number(min !== undefined) +
    2 ** 1 * Number(max !== undefined) +
    2 ** 2 * Number(step !== undefined);

  switch (checksPattern) {
    case 0:
      return z.coerce.number().default(def).catch(def);
    case 1:
      return z.coerce.number().min(min!).default(def).catch(def);
    case 2:
      return z.coerce.number().max(max!).default(def).catch(def);
    case 3:
      return z.coerce.number().min(min!).max(max!).default(def).catch(def);
    case 4:
      return z.coerce.number().step(step!).default(def).catch(def);
    case 5:
      return z.coerce.number().min(min!).step(step!).default(def).catch(def);
    case 6:
      return z.coerce.number().max(max!).step(step!).default(def).catch(def);
    case 7:
      return z.coerce
        .number()
        .min(min!)
        .max(max!)
        .step(step!)
        .default(def)
        .catch(def);
    default:
      return z.coerce.number().default(def).catch(def);
  }
};

/**
 * 標準登録のサーバープロパティ
 * 登録時には各項目に対応する説明文の追加をi18nへ忘れずに実施する
 */
const DefaultServerProperties = z
  .object({
    'accepts-transfers': boolSetter(false),
    'allow-flight': boolSetter(false),
    'allow-nether': boolSetter(true),
    'broadcast-console-to-ops': boolSetter(true),
    'broadcast-rcon-to-ops': boolSetter(true),
    difficulty: enumSetter(['peaceful', 'easy', 'normal', 'hard'], 'easy'),
    'enable-command-block': boolSetter(false),
    'enable-jmx-monitoring': boolSetter(false),
    'enable-query': boolSetter(false),
    'enable-rcon': boolSetter(false),
    'enforce-whitelist': boolSetter(false),
    'entity-broadcast-range-percentage': numberSetter(100, 0, 500),
    'force-gamemode': boolSetter(false),
    'function-permission-level': numberSetter(2, 1, 4, 1),
    gamemode: enumSetter(
      ['survival', 'creative', 'adventure', 'spectator'],
      'survival'
    ),
    'generate-structures': boolSetter(true),
    'generator-settings': stringSetter('{}'),
    hardcore: boolSetter(false),
    'hide-online-players': boolSetter(false),
    // 自動設定のため削除
    // 'level-name': stringSetter('world'),
    'level-seed': stringSetter(''),
    // TODO: CUROIDのようなMODが任意のLevelType入力を要求するため，「その他」のような入力項目を追加する
    'level-type': enumSetter(
      ['default', 'flat', 'largeBiomes', 'amplified', 'buffet'],
      'default'
    ),
    'log-ips': boolSetter(true),
    // legacy?
    'max-build-height': numberSetter(256, undefined, undefined, 8),
    'max-chained-neighbor-updates': numberSetter(1000000),
    'max-players': numberSetter(20, 0, 2 ** 31 - 1),
    'max-tick-time': numberSetter(60000, 0, 2 ** 63 - 1),
    'max-world-size': numberSetter(29999984, 1, 29999984),
    motd: stringSetter('A Minecraft Server'),
    'network-compression-threshold': numberSetter(256, -1),
    'online-mode': boolSetter(true),
    'op-permission-level': numberSetter(4, 1, 4, 1),
    'player-idle-timeout': numberSetter(0, 0),
    'prevent-proxy-connections': boolSetter(false),
    'previews-chat': boolSetter(false),
    pvp: boolSetter(true),
    'query.port': numberSetter(25565, 1, PORT_MAX, 1),
    'rate-limit': numberSetter(0, 0),
    'rcon.password': stringSetter(''),
    'rcon.port': numberSetter(25575, 1, PORT_MAX, 1),
    'region-file-compression': enumSetter(
      ['deflate', 'lz4', 'none'],
      'deflate'
    ),
    'resource-pack': stringSetter(''),
    'resource-pack-id': stringSetter(''),
    'resource-pack-prompt': stringSetter(''),
    'resource-pack-sha1': stringSetter(''),
    'require-resource-pack': boolSetter(false),
    'server-ip': stringSetter(''),
    'server-port': numberSetter(25565, 1, PORT_MAX, 1),
    'simulation-distance': numberSetter(10, 3, 32, 1),
    'snooper-enabled': boolSetter(true),
    'spawn-animals': boolSetter(true),
    'spawn-monsters': boolSetter(true),
    'spawn-npcs': boolSetter(true),
    'spawn-protection': numberSetter(16, 0, undefined, 1),
    'sync-chunk-writes': boolSetter(true),
    'text-filtering-config': stringSetter(''),
    'use-native-transport': boolSetter(true),
    'view-distance': numberSetter(10, 2, 32, 1),
    'white-list': boolSetter(false),
  })
  .catchall(z.string().or(z.number()).or(z.boolean()));

/**
 * DefaultServerPropertiesで設定した型情報をもとに，フロントエンドに渡すプロパティ情報を生成する
 */
function extractPropertyAnnotation(prop: typeof DefaultServerProperties) {
  const anotations: Record<string, ServerPropertyAnnotation> = {};
  const shape = prop._def.shape();

  for (const [key, schema] of toEntries(shape)) {
    // catch > default > String | Number | Boolean の順でネストされた型情報を取得する
    const defaultDef = schema._def.innerType._def;

    if (defaultDef.innerType instanceof z.ZodEffects) {
      anotations[key] = {
        type: 'boolean',
        default: defaultDef.defaultValue() as boolean,
      };
    } else if (defaultDef.innerType instanceof z.ZodString) {
      anotations[key] = {
        type: 'string',
        default: defaultDef.defaultValue() as string,
      };
    } else if (defaultDef.innerType instanceof z.ZodNumber) {
      const tmpObj: NumberServerPropertyAnnotation = {
        type: 'number',
        default: defaultDef.defaultValue() as number,
      };
      defaultDef.innerType._def.checks.forEach((check) => {
        if (check.kind === 'min') {
          tmpObj.min = check.value;
        } else if (check.kind === 'max') {
          tmpObj.max = check.value;
        } else if (check.kind === 'multipleOf') {
          tmpObj.step = check.value;
        }
      });
      anotations[key] = tmpObj;
    } else if (defaultDef.innerType instanceof z.ZodEnum) {
      anotations[key] = {
        type: 'string',
        default: defaultDef.defaultValue() as string,
        enum: defaultDef.innerType.options,
      };
    }
  }

  return anotations;
}

export const DefaultServerPropertiesAnnotation = extractPropertyAnnotation(
  DefaultServerProperties
);
// export const ServerPropertiesAnnotation = z
//   .record(ServerPropertyAnnotation)
//   .default({
//     'accepts-transfers': { type: 'boolean', default: false },

//     'allow-flight': { type: 'boolean', default: false },

//     'allow-nether': { type: 'boolean', default: true },

//     'broadcast-console-to-ops': { type: 'boolean', default: true },

//     'broadcast-rcon-to-ops': { type: 'boolean', default: true },

//     difficulty: {
//       type: 'string',
//       default: 'easy',
//       enum: ['peaceful', 'easy', 'normal', 'hard'],
//     },

//     'enable-command-block': { type: 'boolean', default: false },

//     'enable-jmx-monitoring': { type: 'boolean', default: false },

//     'enable-rcon': { type: 'boolean', default: false },

//     'enable-status': { type: 'boolean', default: true },

//     'enable-query': { type: 'boolean', default: false },

//     'enforce-secure-profile': { type: 'boolean', default: true },

//     'enforce-whitelist': { type: 'boolean', default: false },

//     'entity-broadcast-range-percentage': {
//       type: 'number',
//       default: 100,
//       min: 0,
//       max: 500,
//     },

//     'force-gamemode': { type: 'boolean', default: false },

//     'function-permission-level': { type: 'number', default: 2, min: 1, max: 4 },

//     gamemode: {
//       type: 'string',
//       default: 'survival',
//       enum: ['survival', 'creative', 'adventure', 'spectator'],
//     },

//     'generate-structures': { type: 'boolean', default: true },

//     'generator-settings': { type: 'string', default: '{}' },

//     hardcore: { type: 'boolean', default: false },

//     'hide-online-players': { type: 'boolean', default: false },

//     'initial-disabled-packs': { type: 'string', default: '' },

//     'initial-enabled-packs': { type: 'string', default: 'vanilla' },

//     // 自動設定のため削除
//     // 'level-name': { type: 'string', default: '' },

//     'level-seed': { type: 'string', default: '' },

//     'level-type': {
//       type: 'string',
//       default: 'default',
//       enum: ['default', 'flat', 'largeBiomes', 'amplified', 'buffet'],
//     },

//     'log-ips': { type: 'boolean', default: true },

//     // legacy?
//     'max-build-height': { type: 'number', default: 256, step: 8 },

//     'max-chained-neighbor-updates': { type: 'number', default: 1000000 },

//     'max-players': { type: 'number', default: 20, min: 0, max: 2 ** 31 - 1 },

//     'max-tick-time': {
//       type: 'number',
//       default: 60000,
//       min: 0,
//       max: 2 ** 63 - 1,
//     },

//     'max-world-size': {
//       type: 'number',
//       default: 29999984,
//       min: 1,
//       max: 29999984,
//     },

//     motd: { type: 'string', default: 'A Minecraft Server' },

//     'network-compression-threshold': { type: 'number', default: 256, min: -1 },

//     'online-mode': { type: 'boolean', default: true },

//     'op-permission-level': { type: 'number', default: 4, min: 1, max: 4 },

//     'player-idle-timeout': { type: 'number', default: 0, min: 0 },

//     'prevent-proxy-connections': { type: 'boolean', default: false },

//     'previews-chat': { type: 'boolean', default: false },

//     pvp: { type: 'boolean', default: true },

//     'query.port': { type: 'number', default: 25565, min: 1, max: PORT_MAX },

//     'rate-limit': { type: 'number', default: 0, min: 0 },

//     'rcon.password': { type: 'string', default: '' },

//     'rcon.port': { type: 'number', default: 25575, min: 1, max: PORT_MAX },

//     'region-file-compression': {
//       type: 'string',
//       default: 'deflate',
//       enum: ['deflate', 'lz4', 'none'],
//     },

//     'resource-pack': { type: 'string', default: '' },

//     'resource-pack-id': { type: 'string', default: '' },

//     'resource-pack-prompt': { type: 'string', default: '' },

//     'resource-pack-sha1': { type: 'string', default: '' },

//     'require-resource-pack': { type: 'boolean', default: false },

//     'server-ip': { type: 'string', default: '' },

//     'server-port': { type: 'number', default: 25565, min: 1, max: PORT_MAX },

//     'simulation-distance': { type: 'number', default: 10, min: 3, max: 32 },

//     'snooper-enabled': { type: 'boolean', default: true },

//     'spawn-animals': { type: 'boolean', default: true },

//     'spawn-monsters': { type: 'boolean', default: true },

//     'spawn-npcs': { type: 'boolean', default: true },

//     'spawn-protection': { type: 'number', default: 16, min: 0 },

//     'sync-chunk-writes': { type: 'boolean', default: true },

//     'text-filtering-config': { type: 'string', default: '' },

//     'use-native-transport': { type: 'boolean', default: true },

//     'view-distance': { type: 'number', default: 10, min: 2, max: 32 },

//     'white-list': { type: 'boolean', default: false },
//   });

/** サーバープロパティのデータ */
export const ServerProperties = DefaultServerProperties.default({});
export type ServerProperties = z.infer<typeof ServerProperties>;

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
  BooleanServerPropertyAnnotation
).or(NumberServerPropertyAnnotation);
export type ServerPropertyAnnotation = z.infer<typeof ServerPropertyAnnotation>;

/** サーバープロパティのアノテーション */
export const ServerPropertiesAnnotation = z.record(
  z.string(),
  ServerPropertyAnnotation
);
export type ServerPropertiesAnnotation = z.infer<
  typeof ServerPropertiesAnnotation
>;
