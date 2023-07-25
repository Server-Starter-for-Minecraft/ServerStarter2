import { ImageURI, PlayerUUID, WorldContainer } from './brands';
import { PlayerGroup } from './player';
import { GithubRemoteSetting, RemoteSetting } from './remote';
import { SystemWorldSettings } from './world';
import { Brand } from '../util/brand';

/** システム設定まとめてここに格納 */
export type SystemSettings = {
  container: WorldContainers;
  world: SystemWorldSettings;
  remote: SystemRemoteSetting;
  player: SystemPlayerSetting;
  user: SystemUserSetting;
};

/** 編集済みのシステム設定まとめてここに格納 */
export type SystemSettingsEdited = {
  container: WorldContainers;
  world: SystemWorldSettings;
  remote: SystemRemoteSetting;
  player: SystemPlayerSetting;
  user: SystemUserSetting;
};

/** 言語 */
export type Locale = 'ja' | 'en-US';

export type SystemUserSetting = {
  // ServerStarterの利用規約同意状況
  eula: boolean;
  // カラーテーマ Light/Dark
  theme: 'auto' | 'light' | 'dark';
  // システム言語
  language: Locale;
  // 実行者情報
  // 存在しないプレイヤーのUUIDである可能性あり
  owner: PlayerUUID;
  // 自動シャットダウン
  autoShutDown: boolean;
};

export type WorldContainerSetting = {
  container: WorldContainer;
  visible: boolean;
  name: string;
};

/**
 * GetWorldContainersの戻り値
 * SetWorldContainersの引数
 */
export type WorldContainers = WorldContainerSetting[];

export type SystemPlayerSetting = {
  groups: { [name: string]: PlayerGroup };
  players: PlayerUUID[];
};

export type SystemRemoteSetting = RemoteSetting[]