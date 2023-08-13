import {
  Locale,
  SystemPlayerSetting,
  SystemSettings,
  SystemUserSetting,
  WorldContainerSetting,
} from 'app/src-electron/schema/system';
import {
  applyFixer,
  arrayFixer,
  booleanFixer,
  defaultFixer,
  literalFixer,
  objectFixer,
  recordFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import { fixPlayerGroup } from './player';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { fixPlayerUUID, fixWorldContainer } from './brands';
import { fixRemoteSetting } from './remote';
import { DEFAULT_LOCALE, DEFAULT_WORLD_CONTAINER } from '../const';
import { fixSystemWorldSettings } from './world';
import { genUUID } from 'app/src-electron/tools/uuid';
import {
  RemoteSetting,
} from 'app/src-electron/schema/remote';

export const fixLocale = literalFixer<Locale>(['ja', 'en-US'], DEFAULT_LOCALE);

export const fixSystemUserSetting = objectFixer<SystemUserSetting>(
  {
    // ServerStarterの利用規約同意状況
    eula: booleanFixer(false),
    // カラーテーマ Light/Dark
    theme: literalFixer(['light', 'auto', 'dark'], 'auto'),
    // システム言語
    language: fixLocale,
    // 実行者情報
    owner: defaultFixer(fixPlayerUUID, genUUID<PlayerUUID>()),
    // 自動シャットダウン
    autoShutDown: booleanFixer(false),
  },
  true
);

export const fixWorldContainerSetting = objectFixer<WorldContainerSetting>(
  {
    container: fixWorldContainer,
    name: stringFixer('UnNamed'),
    visible: booleanFixer(true),
  },
  false
);

/**
 * GetWorldContainersの戻り値
 * SetWorldContainersの引数
 */
export const fixWorldContainers = applyFixer(
  arrayFixer<WorldContainerSetting>(fixWorldContainerSetting, true),
  (containers) => {
    if (containers.length === 0) {
      containers.push({
        container: DEFAULT_WORLD_CONTAINER,
        name: 'default',
        visible: true,
      });
    }
    return containers;
  }
);

export const fixSystemPlayerSetting = objectFixer<SystemPlayerSetting>(
  {
    groups: recordFixer(fixPlayerGroup, true),
    players: arrayFixer(fixPlayerUUID, true),
  },
  true
);

export const fixSystemRemoteSetting = arrayFixer<RemoteSetting>(
  fixRemoteSetting,
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
  },
  true
);
