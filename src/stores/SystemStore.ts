import { defineStore } from 'pinia';
import { version } from '../../package.json';
import { Version, VersionType } from 'app/src-electron/schema/version';
import { SystemSettings, WorldContainers } from 'app/src-electron/schema/system';

export const useSystemStore = defineStore('systemStore', {
  state: () => {
    return {
      systemVersion: version,
      publicIP: '000.111.222.333',
      privateIP: '192.168.000.111',
      serverVersions: new Map<VersionType, Version[] | undefined>(),
      worldContainers: {} as WorldContainers,
      systemSettings: {} as SystemSettings,
    };
  },
});
