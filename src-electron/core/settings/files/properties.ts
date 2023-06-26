import { objEach, objMap } from 'src-electron/util/objmap';
import { ServerSettingHandler } from './base';
import { isFailure } from 'src-electron/api/failable';
import {
  ServerProperties,
  ServerPropertiesAnnotation,
} from 'app/src-electron/schema/serverproperty';

// TODO:stringの値のescape/unescape

const PORT_MAX = 2 ** 16 - 2;
export namespace server_properties {
  export const annotations: ServerPropertiesAnnotation = {
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

    'resource-pack': { type: 'string', default: '' },

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
  };

  /** server.propertiesの中身(string)をパースする */
  export const parse = (text: string) => {
    const propertiy: ServerProperties = {};
    text.split('\n').forEach((v) => {
      const match = v.match(/^\s*([a-z\.-]+)\s*=\s*(\w*)\s*$/);
      if (!match) return;

      const [, key, value] = match;

      const defult = annotations[key];

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

  export const stringify = (properties: ServerProperties) => {
    return Object.entries(properties)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
  };
}

const FILENAME = 'server.properties';

const MESSAGE =
  '"このファイルは使用されません。サーバープロパティの書き換えはServerStarter本体から行ってください。"';

export const serverPropertiesHandler: ServerSettingHandler<ServerProperties> = {
  async load(cwdPath) {
    const text = await cwdPath.child(FILENAME).readText();
    if (isFailure(text)) return text;
    return server_properties.parse(text);
  },
  save(cwdPath, value) {
    return cwdPath
      .child(FILENAME)
      .writeText(server_properties.stringify(value));
  },
  remove(cwdPath) {
    return cwdPath.child(FILENAME).writeText(MESSAGE);
  },
};
