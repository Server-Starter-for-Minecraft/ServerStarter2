import { toRaw } from 'vue';
import { defineStore } from 'pinia';
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
      systemSettings: {} as SystemSettings,
    };
  },
});

/**
 * システム設定（変数）の初期化
 */
export function initSystemSettings(sysSettings: SystemSettings) {
  const sysSettingsStore = useSystemSettingsStore();
  sysSettingsStore.systemSettings = sysSettings;
}

/**
 * システム設定（変数）の監視
 */
export function setSysSettingsSubscriber() {
  const sysSettingsStore = useSystemSettingsStore();
  sysSettingsStore.$subscribe((mutation, state) => {
    window.API.invokeSetSystemSettings(toRaw(state.systemSettings));
  });
}
