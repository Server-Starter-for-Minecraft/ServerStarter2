import { ServerPropertyDefinitions } from 'app/src-electron/schema/outerResource/serverProperties';
import {
  DefaultServerPropertiesAnnotation,
  ServerProperties,
} from 'app/src-electron/schema/serverproperty';
import { isError } from 'app/src-electron/util/error/error';
import { properties } from 'app/src-electron/util/format/properties';
import { objValueMap } from 'app/src-electron/util/obj/objmap';
import { getLoadedOuterResource } from '../../outerResource/registry';
import { getStablePropertyType } from '../../outerResource/resources/serverProperties';
import { ServerSettingFile } from './base';

/**
 * server.propertiesの値(文字列)を，定義された型に変換する
 *
 * 変換できない値は文字列のまま残す（既定値への置き換えや範囲での丸めは行わず，ユーザーの値を失わない）
 */
const coerceValue = (
  value: string,
  type: 'string' | 'boolean' | 'number'
): string | boolean | number => {
  switch (type) {
    case 'boolean': {
      const lower = value.trim().toLowerCase();
      if (lower === 'true') return true;
      if (lower === 'false') return false;
      return value;
    }
    case 'number': {
      const num = Number(value.trim());
      return value.trim() !== '' && Number.isFinite(num) ? num : value;
    }
    default:
      return value;
  }
};

/**
 * server.propertiesの中身(string)をパースする
 *
 * アプリ内で定義したプロパティはアプリ内の定義で読み込み，
 * 外部リソースでのみ定義されたプロパティは外部リソースの定義の型に変換する
 *
 * @param text server.propertiesの中身
 * @param definitions 外部リソースのサーバープロパティの定義（未指定の場合は外部リソースの型に変換しない）
 */
export const parseServerProperties = (
  text: string,
  definitions: ServerPropertyDefinitions = {}
) => {
  const raw = properties.parse(text);
  const parsed = ServerProperties.parse(raw);
  for (const [key, value] of Object.entries(raw)) {
    const entry = definitions[key];
    if (entry === undefined || key in DefaultServerPropertiesAnnotation) {
      continue;
    }
    const type = getStablePropertyType(entry);
    if (type !== undefined) parsed[key] = coerceValue(value, type);
  }
  return parsed;
};

/** server.propertiesの中身(string)を，読み込み済みの外部リソースの定義も使ってパースする */
const parse = (text: string) =>
  parseServerProperties(text, getLoadedOuterResource('serverProperties'));

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
    if (!filePath.exists()) return (await getSystemSettings()).world.properties;

    const data = await filePath.readText();

    if (isError(data)) return data;

    const parsed = parse(data);

    return parsed;
  },
  async save(cwdPath, value) {
    const filePath = cwdPath.child(SERVER_PROPERTIES_PATH);
    return await filePath.writeText(stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(SERVER_PROPERTIES_PATH);
  },
};

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test('server_property_parse', () => {
    // bool test (true)
    const boolTest_true = parse('allow-nether=true');
    expect(Object.hasOwn(boolTest_true, 'allow-nether')).toBe(true);
    const boolValue_true = boolTest_true['allow-nether'];
    expect(boolValue_true).toBe(true);
    expect(typeof boolValue_true).toBe('boolean');
    // bool test (false <-- check 'false' > false parse process)
    const boolTest_false = parse('white-list=false');
    expect(Object.hasOwn(boolTest_false, 'white-list')).toBe(true);
    const boolValue_false = boolTest_false['white-list'];
    expect(boolValue_false).toBe(false);
    expect(typeof boolValue_false).toBe('boolean');

    // enum test
    const enumTest = parse('gamemode=survival');
    expect(Object.hasOwn(enumTest, 'gamemode')).toBe(true);
    const enumValue = enumTest['gamemode'];
    expect(enumValue).toBe('survival');
    expect(typeof enumValue).toBe('string');
    // unsupported option in enum test
    const enumUnsupportedTest = parse('gamemode=unsupported'); // unsupported setting
    expect(Object.hasOwn(enumUnsupportedTest, 'gamemode')).toBe(true);
    const enumUnsupportedValue = enumUnsupportedTest['gamemode'];
    expect(enumUnsupportedValue).toBe('unsupported');
    expect(typeof enumUnsupportedValue).toBe('string');

    // number test
    const numberTest = parse('max-tick-time=60000');
    expect(Object.hasOwn(numberTest, 'max-tick-time')).toBe(true);
    const numberValue = numberTest['max-tick-time'];
    expect(numberValue).toBe(60000);
    expect(typeof numberValue).toBe('number');

    // number checks test (if it doesn't use Zod, this test is ineffective)
    const numberCheckTest = parse('function-permission-level=5'); // invalid setting
    expect(Object.hasOwn(numberCheckTest, 'function-permission-level')).toBe(
      true
    );
    const numberCheckValue = numberCheckTest['function-permission-level'];
    expect(numberCheckValue).toBe(2); // overwrote default value
    expect(typeof numberCheckValue).toBe('number');

    // unsupported prop test
    const unsupportedTest = parse('unsupported-prop=test_value');
    expect(Object.hasOwn(unsupportedTest, 'unsupported-prop')).toBe(true);
    const unsupportedValue = unsupportedTest['unsupported-prop'];
    expect(unsupportedValue).toBe('test_value');
    expect(typeof unsupportedValue).toBe('string');
  });
}
