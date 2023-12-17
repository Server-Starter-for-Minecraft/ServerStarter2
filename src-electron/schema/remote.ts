import { ImageURI, PlayerUUID, RemoteWorldName, Timestamp } from './brands';
import { Version } from './version';

export type GithubRemoteFolder = {
  type: 'github';
  owner: string;
  repo: string;
};

export type GithubRemoteSetting = {
  folder: GithubRemoteFolder;
  pat: string;
};

export type RemoteFolder = GithubRemoteFolder;

export type RemoteSetting = GithubRemoteSetting;

export type Remote<T extends RemoteFolder = RemoteFolder> = {
  folder: T;
  name: RemoteWorldName;
};

export type RemoteWorld = {
  /** リモート */
  remote: Remote;

  /** バージョン */
  version: Version;

  /** 起動中フラグ */
  using?: boolean;

  /** 最終プレイ日
   *
   * 協定世界時 (UTC) 1970 年 1 月 1 日 00:00:00 からのミリ秒単位の経過時間を表す数値
   * new Dateの引数にすることで日付が得られる
   */
  last_date?: Timestamp;

  /** 最終プレイ者 */
  last_user?: PlayerUUID;

  /** アイコンのURI */
  avater_path?: ImageURI;

  /** Ngrokによるポート開放不要化機能を利用するか */
  useNgrok: boolean;
};
