import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { version } from '../../package.json';
import { Version, VersionType } from 'app/src-electron/schema/version';
import { SystemRemoteSetting, SystemSettings } from 'app/src-electron/schema/system';
import { StaticResouce } from 'app/src-electron/schema/static';
import { CacheFileData, DatapackData, ModData, PluginData } from 'app/src-electron/schema/filedata';
import { GithubAccountSetting } from 'app/src-electron/schema/remote';
import { values } from 'src/scripts/obj';

type SystemRemoteSettingWithKey = Record<keyof SystemRemoteSetting, { [key: string]: GithubAccountSetting}>

export const useSystemStore = defineStore('systemStore', {
  state: () => {
    return {
      systemVersion: version,
      publicIP: '000.111.222.333',
      privateIP: '192.168.000.111',
      serverVersions: new Map<VersionType, Version[] | undefined>(),
      staticResouces: {} as StaticResouce,
      baseSystemSettings: {} as SystemSettings,
      baseRemotes: { 'github': {} } as SystemRemoteSettingWithKey,
      cacheContents: {
        'datapacks': [] as CacheFileData<DatapackData>[],
        'plugins': [] as CacheFileData<PluginData>[],
        'mods': [] as CacheFileData<ModData>[],
      }
    };
  },
  actions: {
    systemSettings() {
      window.API.invokeSetSystemSettings(toRaw(this.baseSystemSettings))
      return this.baseSystemSettings
    },
    remoteSettings() {
      this.systemSettings().remote.github?.accounts = values(this.baseRemotes.github)
      return this.baseRemotes
    }
  }
});  

export function setInitRemoteSettings() {
  const sysStore = useSystemStore()
  sysStore.baseSystemSettings.remote.github?.accounts.forEach(val => {
    sysStore.baseRemotes.github[`${val.owner}/${val.repo}`] = val
  })
}