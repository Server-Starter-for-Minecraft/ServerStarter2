import { z } from 'zod';
import {
  ImageURI,
  PlayerUUID,
  Timestamp,
  UUID,
  WorldContainer,
  WorldName,
} from './brands';
import { ErrorMessage } from './error';
import {
  AllFileData,
  CustomMapData,
  DatapackData,
  ModData,
  PluginData,
  WorldFileData,
} from './filedata';
import { MemorySettings } from './memory';
import { NgrokSetting } from './ngrok';
import { PlayerSetting } from './player';
import { Remote } from './remote';
import { ServerProperties } from './serverproperty';
import { Version } from './version';

export const WorldID = z.string().uuid().brand('WorldID');
export type WorldID = z.infer<typeof WorldID>;

/** 取得が速い代わりに情報が少ないワールド */
export const WorldAbbr = z.object({
  // /** ICONのパス (たぶんフロントからローカルのファイル読めないのでB64形式でエンコードされた物になるか) */
  // icon: ImageURI.optional(),
  /** ワールド名 */
  name: WorldName,
  /** ディレクトリ */
  container: WorldContainer,
  /** ワールドのID (ServerStarterが起動するごとに変わる) */
  id: WorldID,
});
export type WorldAbbr = z.infer<typeof WorldAbbr>;

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

  /** 最終プレイ環境 */
  last_id?: UUID;

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

  /** Ngrokによるポート開放不要化機能を利用するか */
  ngrok_setting: NgrokSetting;
}

export type WorldAdditional = {
  /** 導入済みデータパック */
  datapacks: WorldFileData<DatapackData>[];

  /** 導入済みプラグイン */
  plugins: WorldFileData<PluginData>[];

  /** 導入済みMOD */
  mods: WorldFileData<ModData>[];
};

export interface World extends WorldBase {
  /** 導入済み */
  additional: WorldAdditional;
}

export type WorldAdditionalEdited = {
  /** 導入済みデータパック */
  datapacks: AllFileData<DatapackData>[];

  /** 導入済みプラグイン */
  plugins: AllFileData<PluginData>[];

  /** 導入済みMOD */
  mods: AllFileData<ModData>[];
};

export interface WorldEdited extends WorldBase {
  /** カスタムマップを導入する場合 */
  custom_map?: CustomMapData;

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

  /** ワールドが実行中の場合にreloadコマンドを実行するかどうか */
  reload?: boolean;

  /** 導入済み */
  additional: WorldAdditionalEdited;
}

/** serverstarterのシステム設定内のワールド設定 */
export const SystemWorldSettings = z.object({
  /** Javaの実行時引数 */
  javaArguments: z.string().optional(),
  memory: MemorySettings,
  properties: ServerProperties,
}).default({});
export type SystemWorldSettings = z.infer<typeof SystemWorldSettings>;

/** サーバーCWD直下の設定系ファイルの情報 */
export type FoldSettings = {
  properties: ServerProperties;
  players: PlayerSetting[];
};
