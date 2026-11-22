import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { showUnexpectedError } from 'src/error/error';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { runDetached } from 'app/src-public/scripts/promise/runDetached';
import {
  CacheFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { StaticResouce } from 'app/src-electron/schema/static';
import { SystemSettings } from 'app/src-electron/schema/system';
import { AllVersion, VersionType } from 'app/src-electron/schema/version';
import { version } from '../../package.json';
import { unloadedStaticResource, unloadedSystemSettings } from './placeholders';
import { setBackSys, setFrontSys } from './SystemStore/converter';
import { FrontPlayerGroup } from './SystemStore/converters/playerGroup';

/**
 * サーバーの種類ごとのバージョンの一覧（取得できた種類のみを持つ）
 */
export type VersionLists = { [K in VersionType]?: AllVersion<K> };

export const useSystemStore = defineStore('systemStore', {
  state: (): {
    systemVersion: string;
    publicIP: string;
    serverVersions: VersionLists;
    staticResouces: StaticResouce;
    cacheContents: {
      datapacks: CacheFileData<DatapackData>[];
      plugins: CacheFileData<PluginData>[];
      mods: CacheFileData<ModData>[];
    };
  } => {
    return {
      systemVersion: version,
      publicIP: '取得できませんでした',
      serverVersions: {},
      staticResouces: unloadedStaticResource(),
      cacheContents: {
        datapacks: [],
        plugins: [],
        mods: [],
      },
    };
  },
  getters: {
    systemSettings() {
      const sysSettingsStore = useSystemSettingsStore();
      return sysSettingsStore.systemSettings;
    },
  },
});

/**
 * SystemSettings専用のStore
 */
const useSystemSettingsStore = defineStore('systemSettingsStore', {
  state: (): {
    backSystemSettings: SystemSettings;
    playerGroups: FrontPlayerGroup;
  } => {
    return {
      backSystemSettings: unloadedSystemSettings(),
      playerGroups: {},
    };
  },
  getters: {
    systemSettings(state) {
      return {
        container: state.backSystemSettings.container,
        world: state.backSystemSettings.world,
        remote: state.backSystemSettings.remote,
        player: {
          groups: state.playerGroups,
        },
        user: state.backSystemSettings.user,
        localSave: state.backSystemSettings.localSave,
        system: state.backSystemSettings.system,
      };
    },
  },
  actions: {
    setSystemSettings(sysSettings: SystemSettings) {
      this.backSystemSettings = toRaw(sysSettings);
      setFrontSys(this.backSystemSettings);
    },
  },
});

/**
 * システム設定（変数）の初期化
 */
export function initSystemSettings(sysSettings: SystemSettings) {
  const sysSettingsStore = useSystemSettingsStore();
  sysSettingsStore.setSystemSettings(sysSettings);
}

/**
 * システム設定（変数）の監視
 */
export function setSysSettingsSubscriber() {
  const sysSettingsStore = useSystemSettingsStore();
  sysSettingsStore.$subscribe((mutation, state) => {
    runDetached(
      window.API.invokeSetSystemSettings(
        deepcopy(setBackSys(deepcopy(state.backSystemSettings)))
      ),
      showUnexpectedError
    );
  });
}

/**
 * SystemSettingsの変換時にデータを取得するStore
 */
export function getConvertTargetStore() {
  return useSystemSettingsStore();
}
