import { WorldContainer } from './brands';
import { Player, PlayerGroup } from './player';
import { GithubRemoteSetting } from './remote';
import { SystemWorldSettings } from './world';

/** システム設定まとめてここに格納 */
export type SystemSettings = {
  container: WorldContainers;
  world: SystemWorldSettings;
  remote: SystemRemoteSetting;
  player: SystemPlayerSetting;
  user: SystemUserSetting;
};

export type Locale = 'ja' | 'en-US';

export type SystemUserSetting = {
  // ServerStarterの利用規約同意状況
  eula: boolean;
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
  groups: PlayerGroup[];
  players: Player[];
};

export type SystemRemoteSetting = {
  github: GithubRemoteSetting;
};
