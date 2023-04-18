import { defineStore } from 'pinia';
import { version } from '../../package.json';

export const useSystemStore = defineStore('systemStore', {
  state: () => {
    return {
      systemVersion: version,
      publicIP: '000.111.222.333',
      privateIP: '192.168.000.111'
    }
  }
})