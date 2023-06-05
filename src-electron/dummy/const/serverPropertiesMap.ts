import { ServerPropertiesMap } from '../../schema/serverproperty';

export const dummyServerPropertiesMap: ServerPropertiesMap = {
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

  'initial-enabled-packs': '',

  // 自動設定のため削除
  // 'level-name': '',

  'level-seed': '',

  'level-type': 'default',

  // legacy?
  'max-build-height': 256,

  'max-chained-neighbor-updates': 1000000,

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
