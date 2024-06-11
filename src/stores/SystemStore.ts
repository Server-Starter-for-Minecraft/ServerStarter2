import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
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
import { setBackSys, setFrontSys } from './SystemStore/converter';
import { FrontPlayerGroup } from './SystemStore/converters/playerGroup';

export const useSystemStore = defineStore('systemStore', {
  state: () => {
    return {
      systemVersion: version,
      publicIP: '取得できませんでした',
      serverVersions: new Map<VersionType, AllVersion<VersionType>>(),
      staticResouces: {} as StaticResouce,
      cacheContents: {
        datapacks: [] as CacheFileData<DatapackData>[],
        plugins: [] as CacheFileData<PluginData>[],
        mods: [] as CacheFileData<ModData>[],
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
  state: () => {
    return {
      backSystemSettings: {} as SystemSettings,
      playerGroups: {} as FrontPlayerGroup,
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
          players: state.backSystemSettings.player.players,
        },
        user: state.backSystemSettings.user,
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
    window.API.invokeSetSystemSettings(
      deepcopy(setBackSys(deepcopy(state.backSystemSettings)))
    );
  });
}

/**
 * SystemSettingsの変換時にデータを取得するStore
 */
export function getConvertTargetStore() {
  return useSystemSettingsStore();
}
