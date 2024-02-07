/**
 * ワールドのディレクトリ構成
 * vanilla : world { DIM-1 | DIM1}
 * plugin  : world | world_nether | world_end
 */
export type WorldDirectoryTypes = 'vanilla' | 'plugin';


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

  /** 同期先のリモートリポジトリ */
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

  /** 起動中フラグ */
  using?: boolean;

  /** ディレクトリ構成 "vanilla" | "plugin" */
  directoryType?: WorldDirectoryTypes;

  /** Ngrokによるポート開放不要化機能を利用するか */
  ngrok_setting: NgrokSetting;
};
