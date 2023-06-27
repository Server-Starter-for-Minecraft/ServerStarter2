import { ImageURI, PlayerUUID, WorldContainer } from './brands';
import { Player, PlayerGroup } from './player';
import { GithubRemoteSetting } from './remote';
import { SystemWorldSettings } from './world';
import { FileData, NewData } from './filedata';
import { Brand } from '../util/brand';

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

/** ローカルのワールドの保存先ディレクトリ */
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
  theme: 'auto' | 'light' | 'dark';
  // システム言語
  language: Locale;
  // 実行者情報
  // 存在しないプレイヤーのUUIDである可能性あり
  owner: PlayerUUID;
  // 自動シャットダウン
  autoShutDown: boolean;
  //ローカルのワールドの保存先ディレクトリ一覧
  localSaveContainer: LocalSaveContainer[];
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
  players: PlayerUUID[];
};

export type SystemRemoteSetting = {
  github?: GithubRemoteSetting;
};

export type CacheContents = {
  /** 導入済みデータパック */
  datapacks?: (FileData | NewData)[];

  /** 導入済みプラグイン */
  plugins?: (FileData | NewData)[];

  /** 導入済みMOD */
  mods?: (FileData | NewData)[];
};
