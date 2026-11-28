/**
 * アプリ内のプロパティ画面のタブ（表示順。「その他」は除く）
 *
 * 外部リソースでタブを定義していない場合（配布元から取得できない場合など）に使う
 */
export const builtInGroupKeys = [
  'base',
  'player',
  'server',
  'generator',
  'spawning',
  'world',
  'network',
  'rcon-query',
  'command',
  'resourcepack',
  'security',
] as const;

/**
 * アプリ内のタブごとのプロパティの分類
 *
 * 外部リソースでタブを指定していないプロパティはこの分類に従う
 */
export const propertyClasses: Readonly<Record<string, readonly string[]>> = {
  base: ['difficulty', 'gamemode'],
  player: [
    'difficulty',
    'hardcore',
    'force-gamemode',
    'gamemode',
    'pvp',
    'hide-online-players',
    'max-players',
    'player-idle-timeout',
  ],
  server: ['motd', 'enable-status'],
  generator: [
    'level-type',
    'level-seed',
    'allow-nether',
    'generate-structures',
    'generator-settings',
    'max-build-height',
    'max-world-size',
  ],
  spawning: ['spawn-animals', 'spawn-monsters', 'spawn-npcs'],
  world: [
    'spawn-protection',
    'view-distance',
    'allow-flight',
    'entity-broadcast-range-percentage',
    'simulation-distance',
    'max-chained-neighbor-updates',
    'sync-chunk-writes',
  ],
  network: [
    'rate-limit',
    'network-compression-threshold',
    'prevent-proxy-connections',
    'online-mode',
    'server-ip',
    'server-port',
    'use-native-transport',
  ],
  'rcon-query': [
    'enable-query',
    'query.port',
    'enable-rcon',
    'rcon.port',
    'rcon.password',
    'broadcast-rcon-to-ops',
    'broadcast-console-to-ops',
  ],
  command: [
    'initial-disabled-packs',
    'initial-enabled-packs',
    'max-tick-time',
    'enable-command-block',
    'function-permission-level',
    'op-permission-level',
  ],
  resourcepack: [
    'resource-pack',
    'resource-pack-prompt',
    'resource-pack-sha1',
    'resource-pack-id',
    'require-resource-pack',
  ],
  security: ['enforce-secure-profile', 'enforce-whitelist', 'white-list'],
};
