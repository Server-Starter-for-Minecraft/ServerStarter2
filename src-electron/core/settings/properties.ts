import { ServerProperties, ServerProperty } from 'src-electron/api/schema';
import { objEach, objMap } from '../../util/objmap';
import { ServerSettingHandler } from './base';
import { isFailure } from 'app/src-electron/api/failable';

// TODO:stringの値のescape/unescape

const PORT_MAX = 2 ** 16 - 2;

export const defaultServerProperties: ServerProperties = {
  'allow-flight': { type: 'boolean', value: false },

  'allow-nether': { type: 'boolean', value: true },

  'broadcast-console-to-ops': { type: 'boolean', value: true },

  'broadcast-rcon-to-ops': { type: 'boolean', value: true },

  difficulty: {
    type: 'string',
    value: 'easy',
    enum: ['peaceful', 'easy', 'normal', 'hard'],
  },

  'enable-command-block': { type: 'boolean', value: false },

  'enable-jmx-monitoring': { type: 'boolean', value: false },

  'enable-rcon': { type: 'boolean', value: false },

  'enable-status': { type: 'boolean', value: true },

  'enable-query': { type: 'boolean', value: false },

  'enforce-secure-profile': { type: 'boolean', value: true },

  'enforce-whitelist': { type: 'boolean', value: false },

  'entity-broadcast-range-percentage': {
    type: 'number',
    value: 100,
    min: 0,
    max: 500,
  },

  'force-gamemode': { type: 'boolean', value: false },

  'function-permission-level': { type: 'number', value: 2, min: 1, max: 4 },

  gamemode: {
    type: 'string',
    value: 'survival',
    enum: ['survival', 'creative', 'adventure', 'spectator'],
  },

  'generate-structures': { type: 'boolean', value: true },

  'generator-settings': { type: 'string', value: '{}' },

  hardcore: { type: 'boolean', value: false },

  'hide-online-players': { type: 'boolean', value: false },

  'initial-disabled-packs': { type: 'string', value: '' },

  'initial-enabled-packs': { type: 'string', value: 'vanilla' },

  // 自動設定のため削除
  // 'level-name': { type: 'string', value: '' },

  'level-seed': { type: 'string', value: '' },

  'level-type': {
    type: 'string',
    value: 'normal',
    enum: ['default', 'flat', 'largeBiomes', 'amplified', 'buffet'],
  },

  // legacy?
  'max-build-height': { type: 'number', value: 256, step: 8 },

  'max-chained-neighbor-updates': { type: 'number', value: 1000000 },

  'max-players': { type: 'number', value: 20, min: 0, max: 2 ** 31 - 1 },

  'max-tick-time': { type: 'number', value: 60000, min: 0, max: 2 ** 63 - 1 },

  'max-world-size': { type: 'number', value: 29999984, min: 1, max: 29999984 },

  motd: { type: 'string', value: 'A Minecraft Server' },

  'network-compression-threshold': { type: 'number', value: 256, min: -1 },

  'online-mode': { type: 'boolean', value: true },

  'op-permission-level': { type: 'number', value: 4, min: 1, max: 4 },

  'player-idle-timeout': { type: 'number', value: 0, min: 0 },

  'prevent-proxy-connections': { type: 'boolean', value: false },

  'previews-chat': { type: 'boolean', value: false },

  pvp: { type: 'boolean', value: true },

  'query.port': { type: 'number', value: 25565, min: 1, max: PORT_MAX },

  'rate-limit': { type: 'number', value: 0, min: 0 },

  'rcon.password': { type: 'string', value: '' },

  'rcon.port': { type: 'number', value: 25575, min: 1, max: PORT_MAX },

  'resource-pack': { type: 'string', value: '' },

  'resource-pack-prompt': { type: 'string', value: '' },

  'resource-pack-sha1': { type: 'string', value: '' },

  'require-resource-pack': { type: 'boolean', value: false },

  'server-ip': { type: 'string', value: '' },

  'server-port': { type: 'number', value: 25565, min: 1, max: PORT_MAX },

  'simulation-distance': { type: 'number', value: 10, min: 3, max: 32 },

  'snooper-enabled': { type: 'boolean', value: true },

  'spawn-animals': { type: 'boolean', value: true },

  'spawn-monsters': { type: 'boolean', value: true },

  'spawn-npcs': { type: 'boolean', value: true },

  'spawn-protection': { type: 'number', value: 16, min: 0 },

  'sync-chunk-writes': { type: 'boolean', value: true },

  'text-filtering-config': { type: 'string', value: '' },

  'use-native-transport': { type: 'boolean', value: true },

  'view-distance': { type: 'number', value: 10, min: 2, max: 32 },

  'white-list': { type: 'boolean', value: false },
};

// {value:
// typ} Keys<T, U> = {
//   [K in keyof T]: T[K] extends U | undefined ? K : never;
// }[keyof T];

// type SetKeys<T, U> = Set<Keys<T, U>>;

export const parseServerProperties = (text: string) => {
  const propertiy: ServerProperties = {};
  text.split('\n').forEach((v) => {
    const match = v.match(/^\s*([a-z\.-]+)\s*=\s*(\w*)\s*$/);
    if (!match) return;

    const [, key, value] = match;

    const defult = defaultServerProperties[key];

    let prop: ServerProperty;

    if (defult !== undefined) {
      // 既知のサーバープロパティの場合
      switch (defult.type) {
        case 'string':
          prop = { ...defult, value };
          break;
        case 'boolean':
          prop = { ...defult, value: value.toLowerCase() === 'true' };
          break;
        case 'number':
          prop = { ...defult, value: Number.parseInt(value) };
          break;
      }
    } else {
      // 未知のサーバープロパティの場合
      prop = { type: 'string', value };
    }

    propertiy[key] = prop;
  });
  return propertiy;
};

export const stringifyServerProperties = (properties: ServerProperties) => {
  console.log(properties);
  return Object.entries(properties)
    .map(([k, v]) => `${k}=${v.value}`)
    .join('\n');
};

export function mergeServerProperties(
  inferior: ServerProperties,
  superior: ServerProperties
) {
  const result = objMap(inferior, (key, value) => [key, { ...value }]);
  objEach(superior, (key, value) => (result[key] = { ...value }));
  return result;
}

const FILENAME = 'server.properties';

export const serverPropertiesHandler: ServerSettingHandler<ServerProperties> = {
  async load(cwdPath) {
    const text = await cwdPath.child(FILENAME).readText();
    if (isFailure(text)) return text;
    return parseServerProperties(text);
  },
  save(cwdPath, value) {
    return cwdPath.child(FILENAME).writeText(stringifyServerProperties(value));
  },
  remove(cwdPath) {
    return cwdPath.child(FILENAME).remove();
  },
};
