/**
 * TODO: Rclone導入時にまとめて更新する
 */
import { z } from 'zod';
import { ImageURI, PlayerUUID, RemoteWorldName, Timestamp } from './brands';
import { NgrokSetting } from './ngrok';
import { Version } from './version';

export const GithubRemoteFolder = z.object({
  type: z.literal('github'),
  owner: z.string(),
  repo: z.string(),
});
export type GithubRemoteFolder = z.infer<typeof GithubRemoteFolder>;

export const GithubRemoteSetting = z.object({
  folder: GithubRemoteFolder,
  pat: z.string(),
});
export type GithubRemoteSetting = z.infer<typeof GithubRemoteSetting>;

export const RemoteFolder = GithubRemoteFolder;
export type RemoteFolder = z.infer<typeof RemoteFolder>;

export const RemoteSetting = GithubRemoteSetting;
export type RemoteSetting = z.infer<typeof RemoteSetting>;

export const Remote = z.object({
  folder: RemoteFolder,
  name: RemoteWorldName,
});
export type Remote = z.infer<typeof Remote>;

export const RemoteWorld = z.object({
  /** リモート */
  remote: Remote,
  /** バージョン */
  version: Version,
  /** 起動中フラグ */
  using: z.boolean().optional(),
  /**
   * 最終プレイ日
   *
   * 協定世界時 (UTC) 1970 年 1 月 1 日 00:00:00 からのミリ秒単位の経過時間を表す数値
   * new Dateの引数にすることで日付が得られる
   */
  last_date: Timestamp.optional(),
  /** 最終プレイ者 */
  last_user: PlayerUUID.optional(),
  /** アイコンのURI */
  avater_path: ImageURI.optional(),
  /** Ngrokによるポート開放不要化機能を利用するか */
  ngrok_setting: NgrokSetting,
});
export type RemoteWorld = z.infer<typeof RemoteWorld>;
