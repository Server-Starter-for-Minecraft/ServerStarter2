import { Player, PlayerGroup } from './player';
import { GithubRemoteSetting } from './remote';
import { SystemWorldSettings } from './world';

/** システム設定まとめてここに格納 */
export type SystemSettings = {
  container: WorldContainers;
  world: SystemWorldSettings;
  remote: RemoteSetting;
  player: PlayerSetting;
  user: UserSetting;
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

export type PlayerSetting = {
  groups: PlayerGroup[];
  players: Player[];
};

export type RemoteSetting = {
  github: GithubRemoteSetting;
};
