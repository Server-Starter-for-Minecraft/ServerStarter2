// フロントエンドとバックエンドでやり取りするデータスキーマ

export type VersionType = 'vanilla' | 'spigot' | 'papermc' | 'forge' | 'mohistmc';

export type VanillaVersion = { id: string; type: 'vanilla'; release: boolean };
export type SpigotVerison = { id: string; type: 'spigot'; release: boolean };
export type PapermcVerison = { id: string; type: 'papermc'; release: boolean };
export type ForgeVerison = { id: string; type: 'forge'; release: boolean };
export type MohistmcVerison = { id: string; type: 'mohistmc'; release: boolean };

export type Version = VanillaVersion | SpigotVerison | PapermcVerison | ForgeVerison | MohistmcVerison;

export type GitRemote = {
  type: 'git';
  owner: string;
  repo: string;
  branch: string;
  new: boolean;
};
export type Remote = GitRemote;

export type ServerProperties = {
  'view-distance'?: number;
  'resource-pack-prompt'?: string;
  'server-ip'?: string;
  'rcon.port'?: number;
  gamemode?: string;
  'server-port'?: number;
  'op-permission-level'?: number;
  'resource-pack'?: string;
  'entity-broadcast-range-percentage'?: number;
  'level-name'?: string;
  'level-type'?: string;
  'player-idle-timeout'?: number;
  'rcon.password'?: string;
  motd?: string;
  'query.port'?: number;
  'rate-limit'?: number;
  'function-permission-level'?: number;
  difficulty?: string;
  'network-compression-threshold'?: number;
  'text-filtering-config'?: string;
  'max-tick-time'?: number;
  'max-players'?: number;
  'resource-pack-sha1'?: string;
  'spawn-protection'?: number;
  'max-world-size'?: number;
  'level-seed'?: string;
  'broadcast-rcon-to-ops'?: boolean;
  'enable-jmx-monitoring'?: boolean;
  'allow-nether'?: boolean;
  'enable-command-block'?: boolean;
  'enable-rcon'?: boolean;
  'sync-chunk-writes'?: boolean;
  'enable-query'?: boolean;
  'prevent-proxy-connections'?: boolean;
  'force-gamemode'?: boolean;
  hardcore?: boolean;
  'white-list'?: boolean;
  'broadcast-console-to-ops'?: boolean;
  pvp?: boolean;
  'spawn-npcs'?: boolean;
  'spawn-animals'?: boolean;
  'snooper-enabled'?: boolean;
  'require-resource-pack'?: boolean;
  'spawn-monsters'?: boolean;
  'enforce-whitelist'?: boolean;
  'use-native-transport'?: boolean;
  'enable-status'?: boolean;
  'online-mode'?: boolean;
  'allow-flight'?: boolean;
  'max-chained-neighbor-updates'?: number;
  'simulation-distance'?: number;
};

export type WorldSettings = {
  version: Version;
  last_date?: Date;
  avater_path?: string;
  using?: boolean;
  last_user?: string;
  properties?: ServerProperties;
  remote?: Remote;
  memory?: number;
  datapacks?: string[];
  plugins?: string[];
  mods?: string[];
  custom_world?: string;
};

export type World = {
  name: string;
  settings: WorldSettings;
};
