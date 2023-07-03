import { defineStore } from 'pinia';
import { version } from '../../package.json';
import { Version, VersionType } from 'app/src-electron/schema/version';
import { SystemSettings } from 'app/src-electron/schema/system';
import { toRaw } from 'vue';

export const useSystemStore = defineStore('systemStore', {
  state: () => {
    return {
      systemVersion: version,
      publicIP: '000.111.222.333',
      privateIP: '192.168.000.111',
      serverVersions: new Map<VersionType, Version[] | undefined>(),
      baseSystemSettings: {} as SystemSettings,
    };
  },
  actions: {
    systemSettings() {
      window.API.invokeSetSystemSettings(toRaw(this.baseSystemSettings))
      return this.baseSystemSettings
    }
  }
});
