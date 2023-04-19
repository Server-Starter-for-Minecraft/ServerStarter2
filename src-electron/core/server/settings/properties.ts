import { ServerProperties } from 'app/src-electron/api/scheme';

export const defaultServerProperties: ServerProperties = {
  'allow-flight': false,
  'allow-nether': true,
  'broadcast-console-to-ops': true,
  'broadcast-rcon-to-ops': true,
  difficulty: 'easy',
  'enable-command-block': false,
  'enable-jmx-monitoring': false,
  'enable-rcon': false,
  'enable-status': true,
  'enable-query': false,
  'enforce-secure-profile': true,
  'enforce-whitelist': false,
  'entity-broadcast-range-percentage': 100,
  'force-gamemode': false,
  'function-permission-level': 2,
  gamemode: 'survival',
  'generate-structures': true,
  'generator-settings': '{}',
  hardcore: false,
  'hide-online-players': false,
  'initial-disabled-packs': '',
  'initial-enabled-packs': 'vanilla',
  'level-name': '',
  'level-seed': '',
  'level-type': 'minecraft:normal',
  'max-chained-neighbor-updates': 1000000,
  'max-players': 20,
  'max-tick-time': 60000,
  'max-world-size': 29999984,
  motd: 'A Minecraft Server',
  'network-compression-threshold': 256,
  'online-mode': true,
  'op-permission-level': 4,
  'player-idle-timeout': 0,
  'prevent-proxy-connections': false,
  'previews-chat': false,
  pvp: true,
  'query.port': 25565,
  'rate-limit': 0,
  'rcon.password': '',
  'rcon.port': 25575,
  'resource-pack': '',
  'resource-pack-prompt': '',
  'resource-pack-sha1': '',
  'require-resource-pack': false,
  'server-ip': '',
  'server-port': 25565,
  'simulation-distance': 10,
  'snooper-enabled': true,
  'spawn-animals': true,
  'spawn-monsters': true,
  'spawn-npcs': true,
  'spawn-protection': 16,
  'sync-chunk-writes': true,
  'text-filtering-config': '',
  'use-native-transport': true,
  'view-distance': 10,
  'white-list': false,
};

type Keys<T, U> = {
  [K in keyof T]: T[K] extends U | undefined ? K : never;
}[keyof T];

type SetKeys<T, U> = Set<Keys<T, U>>;

const boolean_keys: SetKeys<ServerProperties, boolean> = new Set([
  'allow-flight',
  'allow-nether',
  'broadcast-console-to-ops',
  'broadcast-rcon-to-ops',
  'enable-command-block',
  'enable-jmx-monitoring',
  'enable-rcon',
  'enable-status',
  'enable-query',
  'enforce-secure-profile',
  'enforce-whitelist',
  'force-gamemode',
  'generate-structures',
  'hardcore',
  'hide-online-players',
  'online-mode',
  'prevent-proxy-connections',
  'previews-chat',
  'pvp',
  'require-resource-pack',
  'snooper-enabled',
  'spawn-animals',
  'spawn-monsters',
  'spawn-npcs',
  'sync-chunk-writes',
  'use-native-transport',
  'white-list',
]);

const number_keys: SetKeys<ServerProperties, number> = new Set([
  'entity-broadcast-range-percentage',
  'function-permission-level',
  'max-chained-neighbor-updates',
  'max-players',
  'max-tick-time',
  'max-world-size',
  'network-compression-threshold',
  'op-permission-level',
  'player-idle-timeout',
  'query.port',
  'rate-limit',
  'rcon.port',
  'server-port',
  'simulation-distance',
  'spawn-protection',
  'view-distance',
]);

const string_keys: SetKeys<ServerProperties, string> = new Set([
  'difficulty',
  'gamemode',
  'generator-settings',
  'initial-disabled-packs',
  'initial-enabled-packs',
  'level-name',
  'level-seed',
  'level-type',
  'motd',
  'rcon.password',
  'resource-pack',
  'resource-pack-prompt',
  'resource-pack-sha1',
  'text-filtering-config',
  'server-ip',
]);

export const parseServerProperties = (text: string) => {
  const propertiy: ServerProperties = {};
  text.split('\n').forEach((v) => {
    const match = v.match(/^\s*([a-z\.-]+)\s*=\s*(\w*)\s*$/);
    if (match) {
      // TODO: 強引なキャスト
      const [key, value] = match;
      // 
      if (boolean_keys.has(key)) propertiy[key] = value === 'true';
      // 
      else if (number_keys.has(key)) propertiy[key] = Number.parseInt(value);
      // 
      else if (string_keys.has(key)) propertiy[key] = value;
    }
  });
  return propertiy;
};

export const stringifyServerProperties = (properties: ServerProperties) => {
  return Object.entries(properties)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
};
