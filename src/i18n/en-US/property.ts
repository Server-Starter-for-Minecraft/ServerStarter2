export const enUSproperty = {
  init: 'Booting ServerStarter2',
  main: {
    search: 'search properties',
    resetAll: 'reset all',
  },
  //WorldTabsStore.tsのgroupNamesにあったもの
  group: {
    base: 'base settings',
    player: 'player settings',
    server: 'server settings',
    generator: 'world settings',
    spawning: 'world spawn',
    world: 'world',
    network: 'network',
    'rcon-query': 'RCON / Query',
    command: 'command',
    resourcepack: 'resourcepack',
    security: 'security',
    other: 'others',
  },
  description: {
    difficulty: 'Game difficulty',
    hardcore: 'Set gamemode to hardcore',
    'force-gamemode': 'Enforce game mode at login',
    gamemode: 'Gamemode in the game',
    pvp: 'Allow players to fight each other',
    'hide-online-players': 'Hide online players',
    'max-players':
      'Number of people who can play on the server at the same time',
    'player-idle-timeout':
      'If left unattended for a specified number of seconds (= an integer value), the server will kick the user.',
    motd: 'Description displayed on the server selection screen',
    'enable-status': 'Display online status on the server selection screen',
    'level-type': 'World generation value',
    'level-seed': 'World seed value',
    'allow-nether': 'Possible to move to the Nether',
    'generate-structures': 'Generate structures(such as villages)',
    'generator-settings': 'Customize world generation. (JSON)',
    'max-build-height': 'Max height of buildings',
    'max-world-size': 'World size specified by radius',
    'spawn-animals': 'Animals appear',
    'spawn-monsters': 'Hostile MOB appear',
    'spawn-npcs': 'Villagers appear',
    'spawn-protection':
      'Specifies the radius from the center of the spawn (integer value) within which blocks and objects are prohibited from being placed or destroyed.\
      However, this is not valid for players with OP.',
    'view-distance': 'View distance by a chunk',
    'allow-flight': 'Allowed to fly for more than 5 seconds',
    'entity-broadcast-range-percentage':
      'Sets the range of entities to be drawn as a percentage when the initial value is 100.',
    'simulation-distance': 'Sets the range of entities to be simulated',
    'max-chained-neighbor-updates':
      'Limiting the amount of consecutive neighbor updates before skipping',
    'sync-chunk-writes': 'Process chunk writes synchronously',
    'rate-limit':
      'Specifies the maximum amount of packets a client can send per second',
    'network-compression-threshold':
      'Specifies the degree of network compression as an integer.',
    'prevent-proxy-connections':
      'Allow connection from VPN or Proxy when set to False',
    'online-mode':
      'Verify that the connecting player is a legitimate account holder.',
    'server-ip': 'IP address to set up a server',
    'server-port': 'Port number used for opening my server',
    'use-native-transport':
      'Optimize packet communication for servers running on Linux.',
    'enable-query': 'GameSpy4 connection allowed',
    'query.port': 'Query port used for the query server',
    'enable-rcon': 'Allow remote control',
    'rcon.port': 'Port number used for remote control',
    'rcon.password': 'Password used for remote control',
    'broadcast-rcon-to-ops':
      'Notifies the player with OP when a command is input from a remote control.',
    'broadcast-console-to-ops':
      'Notifies the player with OP authority when a command is entered from the server console',
    'initial-disabled-packs': 'List of datapacks to not be auto-enabled on world creation',
    'initial-enabled-packs': 'List of datapacks to be enabled on world creation',
    'max-tick-time':
      'Time in milliseconds between server inoperability and forced shutdown',
    'enable-command-block': 'Allow command block execution',
    'function-permission-level':
      'Function permission level (set between 1 to 4)',
    'op-permission-level': 'Function permission level (set between 1 to 4)',
    'resource-pack': 'URL of the server resource pack',
    'resource-pack-prompt': 'Prompt of server resource pack',
    'resource-pack-sha1': 'Hash value of the server resource pack',
    'require-resource-pack':
      'Force players to install server resource packs, otherwise they will not be able to connect to the world',
    'enforce-secure-profile': 'Allow connections only to players who have Mojang-signed public keys.',
    'enforce-whitelist': 'Deny participation to non-whitelisted players',
    'white-list': 'Manage player login by the white list',
  },
  resetProperty:'Reset setting to default setting \"{defaultProperty}\"',
  resetProperty2:'You can change basic settings from "System Settings" > "Properties".',
  failed: 'Failed to load properties',
};
