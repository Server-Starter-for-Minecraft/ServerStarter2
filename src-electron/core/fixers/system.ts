import {
  CacheContents,
  Locale,
  SystemPlayerSetting,
  SystemRemoteSetting,
  SystemSettings,
  SystemUserSetting,
  WorldContainers,
} from 'app/src-electron/schema/system';
import {
  arrayFixer,
  booleanFixer,
  defaultFixer,
  literalFixer,
  objectFixer,
  optionalFixer,
  recordFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import { fixPlayer, fixPlayerGroup } from './player';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { fixWorldContainer } from './brands';
import { fixGithubRemoteSetting } from './remote';
import { fixFileOrNewData } from './filedata';
import { DEFAULT_LOCALE, DEFAULT_WORLD_CONTAINER } from '../const';
import { fixSystemWorldSettings } from './world';

export const fixLocale = literalFixer<Locale>(['ja', 'en-US'], DEFAULT_LOCALE);

export const fixSystemUserSetting = objectFixer<SystemUserSetting>(
  {
    // ServerStarterの利用規約同意状況
    eula: booleanFixer(false),
    // カラーテーマ Light/Dark
    theme: literalFixer(['auto', 'light', 'dark'], 'auto'),
    // システム言語
    language: fixLocale,
    // 実行者情報
    owner: optionalFixer(fixPlayer),
    // 自動シャットダウン
    autoShutDown: booleanFixer(false),
  },
  true
);

/**
 * GetWorldContainersの戻り値
 * SetWorldContainersの引数
 */
export const fixWorldContainers = objectFixer<WorldContainers>(
  {
    default: defaultFixer(
      fixWorldContainer,
      DEFAULT_WORLD_CONTAINER as WorldContainer
    ),
    custom: recordFixer(fixWorldContainer, true),
  },
  true
);

export const fixSystemPlayerSetting = objectFixer<SystemPlayerSetting>(
  {
    groups: arrayFixer(fixPlayerGroup, true),
    players: arrayFixer(fixPlayer, true),
  },
  true
);

export const fixSystemRemoteSetting = objectFixer<SystemRemoteSetting>(
  {
    github: optionalFixer(fixGithubRemoteSetting),
  },
  true
);

export const fixCacheContents = objectFixer<CacheContents>(
  {
    /** 導入済みデータパック */
    datapacks: optionalFixer(arrayFixer(fixFileOrNewData, false)),

    /** 導入済みプラグイン */
    plugins: optionalFixer(arrayFixer(fixFileOrNewData, false)),

    /** 導入済みMOD */
    mods: optionalFixer(arrayFixer(fixFileOrNewData, false)),
  },
  true
);

/** システム設定まとめてここに格納 */
export const fixSystemSettings = objectFixer<SystemSettings>(
  {
    container: fixWorldContainers,
    world: fixSystemWorldSettings,
    remote: fixSystemRemoteSetting,
    player: fixSystemPlayerSetting,
    user: fixSystemUserSetting,
    cache: fixCacheContents,
  },
  true
);
