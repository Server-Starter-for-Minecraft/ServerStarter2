import { PlayerUUID } from 'app/src-electron/schema/brands';
import { RemoteSetting } from 'app/src-electron/schema/remote';
import {
  Locale,
  SystemPlayerSetting,
  SystemSettings,
  SystemSystemSetting,
  SystemUserSetting,
  WorldContainerSetting,
} from 'app/src-electron/schema/system';
import { genUUID } from 'app/src-electron/tools/uuid';
import {
  applyFixer,
  arrayFixer,
  booleanFixer,
  defaultFixer,
  defaultGetterFixer,
  literalFixer,
  numberFixer,
  objectFixer,
  optionalFixer,
  recordFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import { DEFAULT_WORLD_CONTAINER, getDefaultLocale } from '../const';
import { fixPlayerUUID, fixUUID, fixWorldContainer } from './brands';
import { fixPlayerGroup } from './player';
import { fixRemoteSetting } from './remote';
import { fixSystemWorldSettings } from './world';

export const fixLocale = defaultGetterFixer(
  literalFixer<Locale>(['ja', 'en-US']),
  getDefaultLocale
);

export const fixSystemUserSetting = objectFixer<SystemUserSetting>(
  {
    // ServerStarterの利用規約同意状況
    eula: booleanFixer(false),
    // カラーテーマ Light/Dark
    theme: literalFixer(['light', 'auto', 'dark'], 'auto'),
    // 色覚サポート
    visionSupport: booleanFixer(false),
    // システム言語
    language: fixLocale,
    // 実行者情報
    owner: optionalFixer(fixPlayerUUID),
    // 実行環境ID
    id: defaultGetterFixer(fixUUID, genUUID),
    // 自動シャットダウン
    autoShutDown: booleanFixer(false),
    // World Listの横幅
    drawerWidth: numberFixer(300),
    // NgrokのToken情報
    ngrokToken: optionalFixer(stringFixer()),
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

export const fixSystemSystemSetting = objectFixer<SystemSystemSetting>(
  {
    lastUpdatedTime: optionalFixer(numberFixer()),
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
    system: fixSystemSystemSetting,
  },
  true
);
