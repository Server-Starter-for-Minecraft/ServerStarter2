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
      baseSystemSettings: {} as SystemSettings,
      baseRemotes: {} as { [key: string]: RemoteSetting},
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
      this.systemSettings().remote = values(toRaw(this.baseRemotes))
      return this.baseRemotes
    }
  }
});

export function getRemotesKey(remoteFolder: RemoteFolder) {
  return `${remoteFolder.type}/${remoteFolder.owner}/${remoteFolder.repo}`
}

export function setInitRemoteSettings() {
  const sysStore = useSystemStore()
  sysStore.baseSystemSettings.remote.forEach(remote => {
    sysStore.baseRemotes[`${remote.folder.type}/${remote.folder.owner}/${remote.folder.repo}`] = remote
  })
}