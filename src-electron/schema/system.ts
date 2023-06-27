import { PlayerUUID, WorldContainer } from './brands';
import { Player, PlayerGroup } from './player';
import { GithubRemoteSetting } from './remote';
import { SystemWorldSettings } from './world';
import { FileData, NewData } from './filedata';

/** システム設定まとめてここに格納 */
export type SystemSettings = {
  container: WorldContainers;
  world: SystemWorldSettings;
  remote: SystemRemoteSetting;
  player: SystemPlayerSetting;
  user: SystemUserSetting;
  cache: CacheContents;
};

export type Locale = 'ja' | 'en-US';

export type SystemUserSetting = {
  // ServerStarterの利用規約同意状況
  eula: boolean;
  // カラーテーマ Light/Dark
  theme: 'auto' | 'light' | 'dark';
  // システム言語
  language: Locale;
  // 実行者情報
  owner?: Player;
  // 自動シャットダウン
  autoShutDown: boolean;
};

/**
 * GetWorldContainersの戻り値
 * SetWorldContainersの引数
 */
export type WorldContainers = {
  default: WorldContainer;
  custom: {
    [name in string]: WorldContainer;
  };
};

export type SystemPlayerSetting = {
  groups: { [name: string]: PlayerGroup };
  players: { [uuid: PlayerUUID]: Player };
};

export type SystemRemoteSetting = {
  github: GithubRemoteSetting;
};

export type CacheContents = {
  /** 導入済みデータパック */
  datapacks?: (FileData | NewData)[];

  /** 導入済みプラグイン */
  plugins?: (FileData | NewData)[];

  /** 導入済みMOD */
  mods?: (FileData | NewData)[];
};
