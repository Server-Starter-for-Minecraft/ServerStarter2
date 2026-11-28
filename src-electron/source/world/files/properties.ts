import { ServerPropertyDefinitions } from 'app/src-electron/schema/outerResource/serverProperties';
import {
  coercePropertyValue,
  DefaultServerPropertiesAnnotation,
  ServerProperties,
} from 'app/src-electron/schema/serverproperty';
import { fromRuntimeError, isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { properties } from 'app/src-electron/util/format/properties';
import { objValueMap } from 'app/src-electron/util/obj/objmap';
import { getLoadedOuterResource } from '../../outerResource/registry';
import { getStablePropertyType } from '../../outerResource/resources/serverProperties';
import { ServerSettingFile } from './base';

/**
 * server.propertiesの中身(string)をパースする
 *
 * アプリ内で定義したプロパティはアプリ内の定義で読み込み，
 * 外部リソースでのみ定義されたプロパティは外部リソースの定義の型に変換する
 *
 * @param text server.propertiesの中身
 * @param definitions 外部リソースのサーバープロパティの定義（未指定の場合は外部リソースの型に変換しない）
 * @returns 読み込んだプロパティ（スキーマの検証に失敗した場合はエラー）
 */
export const parseServerProperties = (
  text: string,
  definitions: ServerPropertyDefinitions = {}
): Failable<ServerProperties> => {
  const raw = properties.parse(text);
  const result = ServerProperties.safeParse(raw);
  if (!result.success) return fromRuntimeError(result.error);
  const parsed = result.data;
  for (const [key, value] of Object.entries(raw)) {
    // アプリ内で定義したプロパティは読み込み済み（`Object.hasOwn` で `constructor` などの継承したキーを除く）
    if (
      Object.hasOwn(DefaultServerPropertiesAnnotation, key) ||
      !Object.hasOwn(definitions, key)
    ) {
      continue;
    }
    // 変換できない値は文字列のまま残す（既定値への置き換えや範囲での丸めは行わず，ユーザーの値を失わない）
    const type = getStablePropertyType(definitions[key]);
    if (type !== undefined) parsed[key] = coercePropertyValue(value, type);
  }
  return parsed;
};

/** server.propertiesの中身(string)を，読み込み済みの外部リソースの定義も使ってパースする */
const parse = (text: string): Failable<ServerProperties> =>
  parseServerProperties(
    text,
    getLoadedOuterResource('serverProperties')?.properties
  );

const stringify = (record: ServerProperties) => {
  const converted = objValueMap(record, (value) => {
    switch (typeof value) {
      case 'string':
        return value;
      case 'boolean':
        return value ? 'true' : 'false';
      case 'number':
        return value.toString(10);
      default:
        return '';
    }
  });
  const result = properties.stringify(converted);
  return result;
};

export const SERVER_PROPERTIES_PATH = 'server.properties';

export const serverPropertiesFile: ServerSettingFile<ServerProperties> = {
  async load(cwdPath) {
    const filePath = cwdPath.child(SERVER_PROPERTIES_PATH);

    const { getSystemSettings } = await import('../../../source/stores/system');

    // ファイルが存在しない場合デフォルト値を返す
    if (!(await filePath.exists()))
      return (await getSystemSettings()).world.properties;

    const data = await filePath.readText();

    if (isError(data)) return data;

    const parsed = parse(data);

    return parsed;
  },
  async save(cwdPath, value) {
    const filePath = cwdPath.child(SERVER_PROPERTIES_PATH);
    return filePath.writeText(stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(SERVER_PROPERTIES_PATH);
  },
};

/** In Source Testing */
if (import.meta.vitest) {
  // アサーション関数は型注釈のある名前でしか呼べないため，型を明示して取り出す
  const assertions = await import('app/test/util/assert');
  const assertOk: typeof assertions.assertOk = assertions.assertOk;

  /** パースに成功することを確認して，結果を返す */
  const parseOk = (text: string) => {
    const result = parse(text);
    assertOk(result);
    return result;
  };

  test('server_property_parse', () => {
    // bool test (true)
    const boolTest_true = parseOk('allow-nether=true');
    expect(Object.hasOwn(boolTest_true, 'allow-nether')).toBe(true);
    const boolValue_true = boolTest_true['allow-nether'];
    expect(boolValue_true).toBe(true);
    expect(typeof boolValue_true).toBe('boolean');
    // bool test (false <-- check 'false' > false parse process)
    const boolTest_false = parseOk('white-list=false');
    expect(Object.hasOwn(boolTest_false, 'white-list')).toBe(true);
    const boolValue_false = boolTest_false['white-list'];
    expect(boolValue_false).toBe(false);
    expect(typeof boolValue_false).toBe('boolean');

    // enum test
    const enumTest = parseOk('gamemode=survival');
    expect(Object.hasOwn(enumTest, 'gamemode')).toBe(true);
    const enumValue = enumTest['gamemode'];
    expect(enumValue).toBe('survival');
    expect(typeof enumValue).toBe('string');
    // unsupported option in enum test
    const enumUnsupportedTest = parseOk('gamemode=unsupported'); // unsupported setting
    expect(Object.hasOwn(enumUnsupportedTest, 'gamemode')).toBe(true);
    const enumUnsupportedValue = enumUnsupportedTest['gamemode'];
    expect(enumUnsupportedValue).toBe('unsupported');
    expect(typeof enumUnsupportedValue).toBe('string');

    // number test
    const numberTest = parseOk('max-tick-time=60000');
    expect(Object.hasOwn(numberTest, 'max-tick-time')).toBe(true);
    const numberValue = numberTest['max-tick-time'];
    expect(numberValue).toBe(60000);
    expect(typeof numberValue).toBe('number');

    // 範囲外の値も書き換えずに読み込む（範囲はプロパティ画面の入力チェックにのみ使う）
    const numberCheckTest = parseOk('function-permission-level=5');
    expect(numberCheckTest['function-permission-level']).toBe(5);

    // unsupported prop test
    const unsupportedTest = parseOk('unsupported-prop=test_value');
    expect(Object.hasOwn(unsupportedTest, 'unsupported-prop')).toBe(true);
    const unsupportedValue = unsupportedTest['unsupported-prop'];
    expect(unsupportedValue).toBe('test_value');
    expect(typeof unsupportedValue).toBe('string');
  });
}
