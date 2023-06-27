import { Brand } from '../util/brand';
import {
  ImageURI,
  PlayerUUID,
  Timestamp,
  UUID,
  WorldContainer,
  WorldName,
} from './brands';
import { ErrorMessage } from './error';
import { FileData, NewData } from './filedata';
import { MemorySettings } from './memory';
import { PlayerSetting } from './player';
import { Remote } from './remote';
import { ServerProperties } from './serverproperty';
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
}

/** ワールドごとの設定 */
export interface WorldBase extends WorldAbbr {
  /** バージョン */
  version: Version;

  /** 起動中フラグ */
  using?: boolean;

  /** 同期先のリモート */
  remote?: Remote;

  /** 最終プレイ日
   *
   * 協定世界時 (UTC) 1970 年 1 月 1 日 00:00:00 からのミリ秒単位の経過時間を表す数値
   * new Dateの引数にすることで日付が得られる
   */
  last_date?: Timestamp;

  /** 最終プレイ者 */
  last_user?: PlayerUUID;

  /** 使用メモリ量 */
  memory: MemorySettings;

  /** Javaの実行時引数 */
  javaArguments?: string;

  /** server.propertiesの内容 */
  properties: ServerProperties | ErrorMessage;

  /** プレイヤーの設定 */
  players: PlayerSetting[] | ErrorMessage;

  /** アイコンのURI */
  avater_path?: ImageURI;
}

export type WorldAdditional = {
  /** 導入済みデータパック */
  datapacks: FileData[] | ErrorMessage;

  /** 導入済みプラグイン */
  plugins: FileData[] | ErrorMessage;

  /** 導入済みMOD */
  mods: FileData[] | ErrorMessage;
};

export interface World extends WorldBase {
  /** 導入済み */
  additional: WorldAdditional;
}

export type WorldEditedAdditional = {
  /** 導入済みデータパック */
  datapacks: (FileData | NewData)[] | ErrorMessage;

  /** 導入済みプラグイン */
  plugins: (FileData | NewData)[] | ErrorMessage;

  /** 導入済みMOD */
  mods: (FileData | NewData)[] | ErrorMessage;
};

export interface WorldEdited extends WorldBase {
  /** カスタムマップを導入する場合 */
  custom_map?: NewData;

  /** データの取得元のリモート(同期はしない)
   * リモート版カスタムマップ的な感じ
   * 新規ワールドで既存リモートを読み込むときくらいにしか使わないと思う
   * {
   *   remote_source:A
   *   remote:B
   * }
   * とした場合 Aからワールドのデータを取得して Bと同期する
   */
  remote_source?: Remote;

  /** 導入済み */
  additional: WorldEditedAdditional;
}

/** serverstarterのシステム設定内のワールド設定 */
export type SystemWorldSettings = {
  /** Javaの実行時引数 */
  javaArguments?: string;

  memory: MemorySettings;

  properties: ServerProperties;
};

/** サーバーCWD直下の設定系ファイルの情報 */
export type FoldSettings = {
  properties: ServerProperties;
  players: PlayerSetting[];
};
