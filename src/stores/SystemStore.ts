import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { version } from '../../package.json';
import { Version, VersionType } from 'app/src-electron/schema/version';
import { SystemSettings } from 'app/src-electron/schema/system';
import { StaticResouce } from 'app/src-electron/schema/static';
import { CacheFileData, DatapackData, ModData, PluginData } from 'app/src-electron/schema/filedata';
import { RemoteFolder, RemoteSetting } from 'app/src-electron/schema/remote';
import { values } from 'src/scripts/obj';

export const useSystemStore = defineStore('systemStore', {
  state: () => {
    return {
      systemVersion: version,
      publicIP: '000.111.222.333',
      privateIP: '192.168.000.111',
      serverVersions: new Map<VersionType, Version[]>(),
      staticResouces: {} as StaticResouce,
      cacheContents: {
        'datapacks': [] as CacheFileData<DatapackData>[],
        'plugins': [] as CacheFileData<PluginData>[],
        'mods': [] as CacheFileData<ModData>[],
      }
    };
  },
  getters: {
    systemSettings() {
      const sysSettingsStore = useSystemSettingsStore()
      return sysSettingsStore.systemSettings
    },
    remoteSettings() {
      const remoteStore = useRemoteSettingsStore()
      return remoteStore.remoteSettings
    }
  }
});


/**
 * SystemSettings専用のStore
 */
const useSystemSettingsStore = defineStore('systemSettingsStore', {
  state: () => {
    return {
      systemSettings: {} as SystemSettings
    }
  }
})

/**
 * システム設定（変数）の初期化
 */
export function initSystemSettings(sysSettings: SystemSettings) {
  const sysSettingsStore = useSystemSettingsStore()
  sysSettingsStore.systemSettings = sysSettings
}

/**
 * システム設定（変数）の監視
 */
export function setSysSettingsSubscriber() {
  const sysSettingsStore = useSystemSettingsStore()
  sysSettingsStore.$subscribe((mutation, state) => {
    window.API.invokeSetSystemSettings(toRaw(state.systemSettings))
  })
}


/**
 * リモート設定専用のStore
 */
const useRemoteSettingsStore = defineStore('remoteSettingsStore', {
  state: () => {
    return {
      remoteSettings: {} as { [key: string]: RemoteSetting}
    }
  }
})

/**
 * リモート設定の初期化
 */
export function initRemoteSettings() {
  const sysStore = useSystemStore()
  const remoteSettingsStore = useRemoteSettingsStore()
  sysStore.systemSettings.remote.forEach(remote => {
    remoteSettingsStore.remoteSettings[`${remote.folder.type}/${remote.folder.owner}/${remote.folder.repo}`] = remote
  })
}

/**
 * リモート設定の監視
 */
export function setRemoteSettingsSubscriber() {
  const sysStore = useSystemStore()
  const remoteStore = useRemoteSettingsStore()
  remoteStore.$subscribe((mutation, state) => {
    sysStore.systemSettings.remote = values(toRaw(state.remoteSettings))
  })
}

/**
 * リモート設定を保存しているデータのキーを取得する
 */
export function getRemotesKey(remoteFolder: RemoteFolder) {
  return `${remoteFolder.type}/${remoteFolder.owner}/${remoteFolder.repo}`
}