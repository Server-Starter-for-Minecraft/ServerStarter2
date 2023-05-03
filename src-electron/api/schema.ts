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

/** mod/plugin/datapackのデータを表す */
export type FileData = {
  name: string;
};

/** 新しく追加する際のmod/plugin/datapackのデータを表す */
export type NewData = {
  name: string;
  path: string;
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

/** ワールドごとの設定 */
export type WorldBase = {
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

  /** pull元のリモートリポジトリ */
  remote_pull?: Remote;

  /** push先のリモートリポジトリ */
  remote_push?: Remote;

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
};

export type WorldAdditional = {
  /** 導入済みデータパック */
  datapacks?: FileData[];

  /** 導入済みプラグイン */
  plugins?: FileData[];

  /** 導入済みMOD */
  mods?: FileData[];
};

export type World = WorldBase & {
  /** 導入済み */
  additional: WorldAdditional;
};

export type WorldEditedAdditional = {
  /** 導入済みデータパック */
  datapacks?: (FileData | NewData)[];

  /** 導入済みプラグイン */
  plugins?: (FileData | NewData)[];

  /** 導入済みMOD */
  mods?: (FileData | NewData)[];
};

export type WorldEdited = WorldBase & {
  /** ワールド名称を変更する場合 */
  new_name?: string;

  /** カスタムマップを導入する場合 */
  custom_map?: NewData;

  /** 導入済み */
  additional: WorldEditedAdditional;
};

/** serverstarterのシステム設定内のワールド設定 */
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
