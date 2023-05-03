// フロントエンドとバックエンドでやり取りするデータスキーマ

export const versionTypes = [
  'vanilla',
  'spigot',
  'papermc',
  'forge',
  'mohistmc',
  'fabric',
] as const;
export type VersionType = (typeof versionTypes)[number];

export type VanillaVersion = { id: string; type: 'vanilla'; release: boolean };
export type SpigotVersion = { id: string; type: 'spigot' };
export type PapermcVersion = { id: string; type: 'papermc'; build: number };
export type ForgeVersion = { id: string; type: 'forge'; forge_version: string };
export type MohistmcVersion = {
  id: string;
  type: 'mohistmc';
  forge_version?: string;
  number: number;
};
export type FabricVersion = {
  id: string;
  type: 'fabric';
  release: boolean;
  loader: string;
  installer: string;
};

export type Version =
  | VanillaVersion
  | SpigotVersion
  | PapermcVersion
  | ForgeVersion
  | MohistmcVersion
  | FabricVersion;

export type GithubRemote = {
  type: 'github';
  owner: string;
  repo: string;
  branch: string;
};

export type Remote = GithubRemote;

export const worldTypes = [
  'normal',
  'flat',
  'largeBiomes',
  'amplified',
] as const;
export type WorldType = (typeof worldTypes)[number];

export const difficulty = ['peaceful', 'easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof difficulty)[number];

export const gamemode = [
  'survival',
  'creative',
  'adventure',
  'spectator',
] as const;
export type Gamemode = (typeof gamemode)[number];

export const function_permission_level = [1, 2, 3, 4] as const;
export type FunctionPermissionLevel =
  (typeof function_permission_level)[number];

export const op_permission_level = [0, 1, 2, 3, 4] as const;
export type OpPermissionLevel = (typeof op_permission_level)[number];

export type StringServerProperty = {
  type: 'string';
  value: string;
  enum?: string[];
};

export type BooleanServerProperty = {
  type: 'boolean';
  value: boolean;
};

export type NumberServerProperty = {
  type: 'number';
  value: number;

  /** value % step == 0 */
  step?: number;

  /** min <= value <= max */
  min?: number;
  max?: number;
};

export type ServerProperty =
  | StringServerProperty
  | BooleanServerProperty
  | NumberServerProperty;

export type ServerProperties = {
  [key in string]: ServerProperty;
};

export type FileData = {
  name: string;
  sha1: string;
};

export type WorldAbbr = {
  /** ワールド名 */
  name: string;

  /** ディレクトリ */
  container: string;

  /** ICONのパス (たぶんフロントからローカルのファイル読めないのでB64形式でエンコードされた物になるか) */
  avater_path?: string;
};

export type ServerPropertiesMap = {
  [key in string]: string | number | boolean;
};

export type WorldSettings = {
  /** 使用メモリ量 (Gb) */
  memory?: number;

  /** バージョン */
  version: Version;

  /** リモートリポジトリ */
  remote?: Remote;

  /** 最終プレイ日
   *
   * 協定世界時 (UTC) 1970 年 1 月 1 日 00:00:00 からのミリ秒単位の経過時間を表す数値
   * new Dateの引数にすることで日付が得られる
   */
  last_date?: number;

  /** 最終プレイ者 */
  last_user?: Player;

  /** 起動中フラグ */
  using?: boolean;

  /** 起動中フラグ */
  properties?: ServerPropertiesMap;
};

export type World = {
  /** ワールド名 */
  name: string;

  /** ディレクトリ */
  container: string;

  /** ICONのパス (たぶんフロントからローカルのファイル読めないのでB64形式でエンコードされた物になるか) */
  avater_path?: string;

  /** バージョン */
  version: Version;

  /** 起動中フラグ */
  using?: boolean;

  /** リモートリポジトリ */
  remote?: Remote;

  /** 最終プレイ日
   *
   * 協定世界時 (UTC) 1970 年 1 月 1 日 00:00:00 からのミリ秒単位の経過時間を表す数値
   * new Dateの引数にすることで日付が得られる
   */
  last_date?: number;

  /** 最終プレイ者 */
  last_user?: Player;

  /** 使用メモリ量 (Gb) */
  memory?: number;

  /** server.propertiesの内容 */
  properties?: ServerProperties;

  /** 導入済み */
  additional: {
    /** 導入済みデータパック */
    datapacks?: FileData[];

    /** 導入済みプラグイン */
    plugins?: FileData[];

    /** 導入済みMOD */
    mods?: FileData[];
  };
};

/** serverstarterのデフォルトワールド設定 */
export type SystemWorldSettings = {
  memory: number;
  properties: ServerProperties;
};

export type GithubAccountSetting = {
  owner: string;
  repo: string;
  pat: string;
};

export type GithubRemoteSetting = {
  accounts: GithubAccountSetting[];
};

export type RemoteSetting = {
  github: GithubRemoteSetting;
};

export type PlayerSetting = {
  groups: PlayerGroup[];
  players: Player[];
};

export type Player = {
  name: string;
  uuid: string;
};

export type PlayerGroup = {
  name: string;
  players: Player[];
};

export type Locale = 'ja' | 'en-US';

export type UserSetting = {
  // ServerStarterの利用規約同意状況
  eula: boolean;
  // システム言語
  language: Locale;
  // 実行者情報
  owner?: Player;
  // 自動シャットダウン
  autoShutDown: boolean;
};

/** システム設定まとめてここに格納 */
export type SystemSettings = {
  container: WorldContainers;
  world: SystemWorldSettings;
  remote: RemoteSetting;
  player: PlayerSetting;
  user: UserSetting;
};

/**
 * GetWorldContainersの戻り値
 * SetWorldContainersの引数
 */
export type WorldContainers = {
  default: string;
  custom: {
    [name in string]: string;
  };
};

// {
//   'allow-flight'?: boolean;
//   'allow-nether'?: boolean;
//   'broadcast-console-to-ops'?: boolean;
//   'broadcast-rcon-to-ops'?: boolean;
//   difficulty?: Difficulty;
//   'enable-command-block'?: boolean;
//   'enable-jmx-monitoring'?: boolean;
//   'enable-rcon'?: boolean;
//   'enable-status'?: boolean;
//   'enable-query'?: boolean;
//   'enforce-secure-profile'?: boolean;
//   'enforce-whitelist'?: boolean;
//   // 10-1000
//   'entity-broadcast-range-percentage'?: number;
//   'force-gamemode'?: boolean;
//   'function-permission-level'?: FunctionPermissionLevel;
//   gamemode?: Gamemode;
//   'generate-structures'?: boolean;
//   'generator-settings'?: string;
//   hardcore?: boolean;
//   'hide-online-players'?: boolean;
//   'initial-disabled-packs'?: string;
//   'initial-enabled-packs'?: string;
//   'level-name'?: string;
//   'level-seed'?: string;
//   'level-type'?: WorldType;
//   'max-chained-neighbor-updates'?: number;
//   // 0...2^31-1
//   'max-players'?: number;
//   // 0...2^63-1
//   'max-tick-time'?: number;
//   // 1...29999984
//   'max-world-size'?: number;
//   // len < 59
//   motd?: string;
//   'network-compression-threshold'?: number;
//   'online-mode'?: boolean;
//   'op-permission-level'?: OpPermissionLevel;
//   'player-idle-timeout'?: number;
//   'prevent-proxy-connections'?: boolean;
//   'previews-chat'?: boolean;
//   pvp?: boolean;
//   // 1...2^16-2
//   'query.port'?: number;
//   'rate-limit'?: number;
//   'rcon.password'?: string;
//   // 1...2^16-2
//   'rcon.port'?: number;
//   'resource-pack'?: string;
//   'resource-pack-prompt'?: string;
//   'resource-pack-sha1'?: string;
//   'require-resource-pack'?: boolean;
//   'server-ip'?: string;
//   // 1...2^16-2
//   'server-port'?: number;
//   // 3...32
//   'simulation-distance'?: number;
//   'snooper-enabled'?: boolean;
//   'spawn-animals'?: boolean;
//   'spawn-monsters'?: boolean;
//   'spawn-npcs'?: boolean;
//   'spawn-protection'?: number;
//   'sync-chunk-writes'?: boolean;
//   // enigma
//   'text-filtering-config'?: string;
//   'use-native-transport'?: boolean;
//   // 3...32
//   'view-distance'?: number;
//   'white-list'?: boolean;
// };
