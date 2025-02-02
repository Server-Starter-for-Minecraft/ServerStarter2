import {
  ServerProperties,
  ServerPropertiesAnnotation,
} from 'app/src-electron/schema/serverproperty';
import { isError } from 'app/src-electron/util/error/error';
import { objValueMap } from 'app/src-electron/util/objmap';
import * as properties from 'app/src-electron/util/properties';
import { ServerSettingFile } from './base';

/** server.propertiesの中身(string)をパースする */
const parse = (text: string) => {
  const propertiy: ServerProperties = {};
  const record = properties.parse(text);
  Object.entries(record).forEach(([key, value]) => {
    const defult = ServerPropertiesAnnotation.parse({})[key];

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
