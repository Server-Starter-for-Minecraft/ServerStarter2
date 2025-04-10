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
) => z.enum(values).or(z.string()).default(def).catch(def);
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
      return z.coerce
        .number()
        .min(min ?? -Infinity)
        .default(def)
        .catch(def);
    case 2:
      return z.coerce
        .number()
        .max(max ?? Infinity)
        .default(def)
        .catch(def);
    case 3:
      return z.coerce
        .number()
        .min(min ?? -Infinity)
        .max(max ?? Infinity)
        .default(def)
        .catch(def);
    case 4:
      return z.coerce
        .number()
        .step(step ?? 1)
        .default(def)
        .catch(def);
    case 5:
      return z.coerce
        .number()
        .min(min ?? -Infinity)
        .step(step ?? 1)
        .default(def)
        .catch(def);
    case 6:
      return z.coerce
        .number()
        .max(max ?? Infinity)
        .step(step ?? 1)
        .default(def)
        .catch(def);
    case 7:
      return z.coerce
        .number()
        .min(min ?? -Infinity)
        .max(max ?? Infinity)
        .step(step ?? 1)
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
    'enable-status': boolSetter(true),
    'enforce-secure-profile': boolSetter(true),
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
    } else if (defaultDef.innerType instanceof z.ZodUnion) {
      anotations[key] = {
        type: 'string',
        default: defaultDef.defaultValue() as string,
        enum: defaultDef.innerType._def.options[0].options,
      };
    }
  }

  return anotations;
}

export const DefaultServerPropertiesAnnotation = extractPropertyAnnotation(
  DefaultServerProperties
);

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
