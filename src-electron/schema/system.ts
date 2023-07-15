import { ImageURI, PlayerUUID, WorldContainer } from './brands';
import { PlayerGroup } from './player';
import { GithubRemoteSetting } from './remote';
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

export const locales = ['ja', 'en-US'] as const;
export type Locale = (typeof locales)[number];

export const colorThemes = ['light', 'auto', 'dark'] as const;
export type ColorTheme = (typeof colorThemes)[number];

/** ローカルのワールドの保存先ディレクトリ (絶対パスのみ) */
export type LocalSaveContainer = Brand<string, 'LocalSaveContainer'>;

/** ローカルのワールド */
export type LocalSave = {
  // 保存先ディレクトリ
  container: LocalSaveContainer;
  // ワールド名
  name: string;
  // icon.png
  avatar_path?: ImageURI;
};

export type SystemUserSetting = {
  // ServerStarterの利用規約同意状況
  eula: boolean;
  // カラーテーマ Light/Dark
  theme: ColorTheme;
  // システム言語
  language: Locale;
  // 実行者情報
  // 存在しないプレイヤーのUUIDである可能性あり
  owner: PlayerUUID;
  // 自動シャットダウン
  autoShutDown: boolean;
  //ローカルのワールドの保存先ディレクトリ一覧
  localSaveContainer: LocalSaveContainer[];
  // ワールドリストの幅
  drawerWidth: number;
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
  players: PlayerUUID[];
};

export type SystemRemoteSetting = {
  github?: GithubRemoteSetting;
};
