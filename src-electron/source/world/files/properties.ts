import {
  ServerProperties,
  ServerPropertiesAnnotation,
} from 'app/src-electron/schema/serverproperty';
import { isError } from 'app/src-electron/util/error/error';
import * as properties from 'app/src-electron/util/format/properties';
import { objValueMap } from 'app/src-electron/util/obj/objmap';
import { ServerSettingFile } from './base';

/** server.propertiesの中身(string)をパースする */
const parse = (text: string) => {
  const propertiy: ServerProperties = {};
  const record = properties.parse(text);
  Object.entries(record).forEach(([key, value]) => {
    const defult = ServerPropertiesAnnotation.parse(undefined)[key];

    let prop: string | number | boolean;

    if (defult !== undefined) {
      // 既知のサーバープロパティの場合
      switch (defult.type) {
        case 'string':
          prop = value;
          break;
        case 'boolean':
          prop = value.toLowerCase() === 'true';
          break;
        case 'number':
          prop = Number.parseInt(value);
          break;
      }
    } else {
      // 未知のサーバープロパティの場合stringとして扱う
      prop = value;
    }
    propertiy[key] = prop;
  });
  return propertiy;
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
    // bool test
    const boolTest = parse('allow-nether=false');
    const boolKey = Object.keys(boolTest)[0];
    const boolValue = Object.values(boolTest)[0];
    expect(boolKey).toBe('allow-nether');
    expect(boolValue).toBe(false);
    expect(typeof boolValue).toBe('boolean');

    // enum test
    const enumTest = parse('gamemode=survival');
    const enumKey = Object.keys(enumTest)[0];
    const enumValue = Object.values(enumTest)[0];
    expect(enumKey).toBe('gamemode');
    expect(enumValue).toBe('survival');
    expect(typeof enumValue).toBe('string');

    // number test
    const numberTest = parse('max-tick-time=60000');
    const numberKey = Object.keys(numberTest)[0];
    const numberValue = Object.values(numberTest)[0];
    expect(numberKey).toBe('max-tick-time');
    expect(numberValue).toBe(60000);
    expect(typeof numberValue).toBe('number');

    // number checks test (if it doesn't use Zod, this test is ineffective)
    const numberCheckTest = parse('function-permission-level=5'); // invalid setting
    const numberCheckKey = Object.keys(numberCheckTest)[0];
    const numberCheckValue = Object.values(numberCheckTest)[0];
    expect(numberCheckKey).toBe('function-permission-level');
    expect(numberCheckValue).toBe(5);
    expect(typeof numberCheckValue).toBe('number');
  });
}
