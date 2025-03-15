import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { isError } from 'app/src-electron/util/error/error';
import * as properties from 'app/src-electron/util/format/properties';
import { objValueMap } from 'app/src-electron/util/obj/objmap';
import { ServerSettingFile } from './base';

/** server.propertiesの中身(string)をパースする */
const parse = (text: string) => {
  return ServerProperties.parse(properties.parse(text));
};

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

    await filePath.writeText(stringify(value));
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
