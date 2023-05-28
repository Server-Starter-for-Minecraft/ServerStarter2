interface iPropertyClasses {
  [key: string]: string[]
}

export const propertyClasses: iPropertyClasses = {
  'base': [
    'difficulty',
    'gamemode',
  ],
  'player': [
    'difficulty',
    'hardcore',
    'force-gamemode',
    'gamemode',
    'pvp',
    'hide-online-players',
    'max-players',
    'player-idle-timeout',
  ],
  'server': [
    'motd',
    'enable-status',
    'level-name',
  ],
  'generater': [
    'level-type',
    'level-seed',
    'allow-nether',
    'generate-structures',
    'generator-settings',
    'max-build-height',
    'max-world-size',
  ],
  'spawning': [
    'spawn-animals',
    'spawn-monsters',
    'spawn-npcs',
  ],
  'world': [
    'spawn-protection',
    'view-distance',
    'allow-flight',
    'entity-broadcast-range-percentage',
    'simulation-distance',
    'max-chained-neighbor-updates',
    'sync-chunk-writes',
  ],
  'network': [
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
  'command': [
    'initial-disabled-packs',
    'initial-enabled-packs',
    'max-tick-time',
    'enable-command-block',
    'function-permission-level',
    'op-permission-level',
  ],
  'resourcepack': [
    'resource-pack',
    'resource-pack-prompt',
    'resource-pack-sha1',
    'require-resource-pack',
  ],
  'security': [
    'enforce-secure-profile',
    'enforce-whitelist',
    'white-list',
  ],
  'other': []
}