import { Brand } from '../util/brand';
import { UUID, WorldContainer, WorldName } from './brands';
import { FileData, NewData } from './filedata';
import { MemorySettings } from './memory';
import { Player, PlayerSetting } from './player';
import { Remote } from './remote';
import { ServerProperties, ServerPropertiesMap } from './serverproperty';
import { Version } from './version';

export type WorldID = Brand<UUID, 'WorldID'>;

/** 取得が速い代わりに情報が少ないワールド */
export interface WorldAbbr {
  /** ICONのパス (たぶんフロントからローカルのファイル読めないのでB64形式でエンコードされた物になるか) */
  /** ワールド名 */
  name: WorldName;

  /** ディレクトリ */
  container: WorldContainer;

  /** ワールドのID (ServerStarterが起動するごとに変わる) */
  id: WorldID;

  /** アイコンのURI */
  avater_path?: string;
}

/** ワールドごとの設定 */
export interface WorldBase extends WorldAbbr {
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

  /** 使用メモリ量 */
  memory: MemorySettings;

  /** Javaの実行時引数 */
  javaArguments?: string;

  /** server.propertiesの内容 */
  properties: ServerPropertiesMap;

  /** プレイヤーの設定 */
  players: PlayerSetting[];
}

export type WorldAdditional = {
  /** 導入済みデータパック */
  datapacks?: FileData[];

  /** 導入済みプラグイン */
  plugins?: FileData[];

  /** 導入済みMOD */
  mods?: FileData[];
};

export interface World extends WorldBase {
  /** 導入済み */
  additional: WorldAdditional;
}

export type WorldEditedAdditional = {
  /** 導入済みデータパック */
  datapacks?: (FileData | NewData)[];

  /** 導入済みプラグイン */
  plugins?: (FileData | NewData)[];

  /** 導入済みMOD */
  mods?: (FileData | NewData)[];
};

export type WorldEdited = WorldBase & {
  /** カスタムマップを導入する場合 */
  custom_map?: NewData;

  /** 導入済み */
  additional: WorldEditedAdditional;
};

/**
 * ワールドの設定
 * server_settings.jsonの内容
 */
export type WorldSettings = {
  /** 使用メモリ量 */
  memory: MemorySettings;

  /** Javaの実行時引数 */
  javaArguments?: string;

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

  /** サーバープロパティ */
  properties?: ServerPropertiesMap;

  /** プレイヤーの設定 */
  players: PlayerSetting[];
};

/** serverstarterのシステム設定内のワールド設定 */
export type SystemWorldSettings = {
  /** Javaの実行時引数 */
  javaArguments?: string;

  memory: MemorySettings;

  properties: ServerProperties;
};

/** サーバーCWD直下の設定系ファイルの情報 */
export type FoldSettings = {
  properties: ServerPropertiesMap;
  players: PlayerSetting[];
};
