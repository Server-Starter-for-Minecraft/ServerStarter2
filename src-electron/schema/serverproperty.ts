import { z } from 'zod';
import { toEntries } from '../util/obj/obj';

const PORT_MAX = 2 ** 16 - 2;

/** サーバープロパティの値の型 */
export type ServerPropertyType = 'string' | 'boolean' | 'number';

/**
 * 数値として扱える表記か
 *
 * 数値に変換して文字列に戻したときに元の表記と一致するもののみを数値として扱う
 * （`0x10`・`1e3`・`007`・`+5`・`1.50`・精度を超える整数などを数値にすると，保存時にユーザーの表記が書き換わるため）
 */
const isRoundTripNumber = (text: string) =>
  text !== '' && String(Number(text)) === text;

/**
 * server.properties の値（文字列）を，プロパティの型に変換する
 *
 * 変換できない値は文字列のまま返す（呼び出し元で既定値にするか，そのまま残すかを決める）
 *
 * @param value server.properties の値
 * @param type プロパティの型
 * @returns 変換した値（変換できない場合は元の値）
 */
export function coercePropertyValue(
  value: string,
  type: ServerPropertyType
): string | boolean | number {
  const trimmed = value.trim();
  switch (type) {
    case 'boolean':
      if (trimmed.toLowerCase() === 'true') return true;
      if (trimmed.toLowerCase() === 'false') return false;
      return value;
    case 'number':
      return isRoundTripNumber(trimmed) ? Number(trimmed) : value;
    default:
      return value;
  }
}

/** 文字列を型に変換してから検証するスキーマを作る（文字列以外はそのまま検証する） */
const coerced = <T extends z.ZodType>(type: ServerPropertyType, schema: T) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' ? coercePropertyValue(value, type) : value,
    schema
  );

/** 読み込み用のスキーマのメタデータで，プロパティ画面で使う注釈を保持するキー */
const ANNOTATION_META_KEY = 'serverPropertyAnnotation';

/**
 * プロパティの読み込み用のスキーマに，プロパティ画面で使う注釈を付ける
 *
 * 読み込み時は型の変換のみを行い（型が合わない値は既定値にする），範囲や選択肢による値の書き換えは行わない。
 * 範囲や選択肢は注釈としてプロパティ画面の入力チェックに使う（外部リソースで範囲を変えても値が失われないようにするため）
 */
const withAnnotation = <T extends z.ZodType>(
  schema: T,
  annotation: ServerPropertyAnnotation
) => schema.meta({ [ANNOTATION_META_KEY]: annotation });

const boolSetter = (def: boolean) =>
  withAnnotation(coerced('boolean', z.boolean()).default(def).catch(def), {
    type: 'boolean',
    default: def,
  });
const stringSetter = (def: string) =>
  withAnnotation(z.string().default(def).catch(def), {
    type: 'string',
    default: def,
  });
const enumSetter = <U extends string, T extends Readonly<[U, ...U[]]>>(
  values: T,
  def: T[number]
) =>
  withAnnotation(z.string().default(def).catch(def), {
    type: 'string',
    default: def,
    enum: [...values],
  });
const numberSetter = (def: number, min?: number, max?: number, step?: number) =>
  withAnnotation(coerced('number', z.number()).default(def).catch(def), {
    type: 'number',
    default: def,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(step !== undefined ? { step } : {}),
  });

/**
 * 標準登録のサーバープロパティ
 * 登録時には各項目に対応する説明文の追加をi18nへ忘れずに実施する
 *
 * 数値の範囲は Minecraft Wiki（https://minecraft.wiki/w/Server.properties）の許容値に合わせる
 */
const DefaultServerProperties = z
  .object({
    'accepts-transfers': boolSetter(false),
    'allow-flight': boolSetter(false),
    'allow-nether': boolSetter(true),
    'broadcast-console-to-ops': boolSetter(true),
    'broadcast-rcon-to-ops': boolSetter(true),
    'bug-report-link': stringSetter(''),
    // chat / command ともに，0でスパムによるキックを無効化できる
    'chat-spam-threshold-seconds': numberSetter(10, 0, undefined, 1),
    'command-spam-threshold-seconds': numberSetter(10, 0, undefined, 1),
    difficulty: enumSetter(['peaceful', 'easy', 'normal', 'hard'], 'easy'),
    'enable-code-of-conduct': boolSetter(false),
    'enable-command-block': boolSetter(false),
    'enable-jmx-monitoring': boolSetter(false),
    'enable-query': boolSetter(false),
    'enable-rcon': boolSetter(false),
    'enable-status': boolSetter(true),
    'enforce-secure-profile': boolSetter(true),
    'enforce-whitelist': boolSetter(false),
    'entity-broadcast-range-percentage': numberSetter(100, 10, 1000, 1),
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
    'management-server-allowed-origins': stringSetter(''),
    'management-server-enabled': boolSetter(false),
    'management-server-host': stringSetter('localhost'),
    // 0で起動時にランダムなポートが割り当てられる（上限はTCPポート番号の最大値）
    'management-server-port': numberSetter(0, 0, 2 ** 16 - 1, 1),
    // 空欄の場合はサーバー起動時に自動生成されるため，固定の既定値は持たせない
    'management-server-secret': stringSetter(''),
    'management-server-tls-enabled': boolSetter(true),
    'management-server-tls-keystore': stringSetter(''),
    'management-server-tls-keystore-password': stringSetter(''),
    // legacy?
    'max-build-height': numberSetter(256, undefined, undefined, 8),
    'max-chained-neighbor-updates': numberSetter(
      1000000,
      undefined,
      undefined,
      1
    ),
    'max-players': numberSetter(20, 0, 2 ** 31 - 1, 1),
    // -1でウォッチドッグを無効化できる
    // 上限はJavaのlong型の最大値(2^63-1)だが，JSのnumberで正確に扱える最大値に制限する
    'max-tick-time': numberSetter(60000, -1, Number.MAX_SAFE_INTEGER, 1),
    'max-world-size': numberSetter(29999984, 1, 29999984, 1),
    motd: stringSetter('A Minecraft Server'),
    'network-compression-threshold': numberSetter(256, -1, undefined, 1),
    'online-mode': boolSetter(true),
    'op-permission-level': numberSetter(4, 0, 4, 1),
    // 0以下で一時停止を無効化できるため，下限は設けない
    'pause-when-empty-seconds': numberSetter(60, undefined, undefined, 1),
    'player-idle-timeout': numberSetter(0, 0, undefined, 1),
    'prevent-proxy-connections': boolSetter(false),
    'previews-chat': boolSetter(false),
    pvp: boolSetter(true),
    'query.port': numberSetter(25565, 1, PORT_MAX, 1),
    'rate-limit': numberSetter(0, 0, undefined, 1),
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
    // 0でハートビートの送信を無効化できる
    'status-heartbeat-interval': numberSetter(0, 0, undefined, 1),
    'sync-chunk-writes': boolSetter(true),
    'text-filtering-config': stringSetter(''),
    'text-filtering-version': numberSetter(0, 0, 1, 1),
    'use-native-transport': boolSetter(true),
    'view-distance': numberSetter(10, 2, 32, 1),
    'white-list': boolSetter(false),
  })
  .catchall(z.string().or(z.number()).or(z.boolean()));

/**
 * DefaultServerPropertiesで設定した注釈をもとに，フロントエンドに渡すプロパティ情報を生成する
 */
function extractPropertyAnnotation(prop: typeof DefaultServerProperties) {
  const annotations: Record<string, ServerPropertyAnnotation> = {};
  for (const [key, schema] of toEntries(prop.shape)) {
    const annotation = schema.meta()?.[ANNOTATION_META_KEY];
    if (annotation) annotations[key] = annotation as ServerPropertyAnnotation;
  }
  return annotations;
}

export const DefaultServerPropertiesAnnotation = extractPropertyAnnotation(
  DefaultServerProperties
);

/** サーバープロパティのデータ */
export const ServerProperties = DefaultServerProperties.prefault({});
export type ServerProperties = z.infer<typeof ServerProperties>;

/**
 * サーバー起動時にServerStarterがポート番号を割り当てるプロパティ
 *
 * ポート開放不要化（Ngrok）の利用時はランダムなポート番号が割り当てられるため，ユーザーの設定値は使われない
 */
export const serverPortPropertyKeys = ['server-port', 'query.port'] as const;
export type ServerPortPropertyKey = (typeof serverPortPropertyKeys)[number];

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

/**
 * 数値型のサーバープロパティの値がアノテーションで定義された範囲（min / max / step）を満たすか判定する
 *
 * プロパティ画面の入力チェックに使用する
 *
 * @param value 判定する値
 * @param annotation 対象プロパティのアノテーション
 * @returns 値が許容される場合は`true`
 */
export function isValidNumberProperty(
  value: number,
  annotation: Pick<NumberServerPropertyAnnotation, 'min' | 'max' | 'step'>
): boolean {
  const { min, max, step } = annotation;
  return (
    !isNaN(value) &&
    (min === undefined || value >= min) &&
    (max === undefined || value <= max) &&
    (step === undefined || value % step === 0)
  );
}

export const ServerPropertyAnnotation = StringServerPropertyAnnotation.or(
  BooleanServerPropertyAnnotation
).or(NumberServerPropertyAnnotation);
export type ServerPropertyAnnotation = z.infer<typeof ServerPropertyAnnotation>;
