import { defineStore } from 'pinia';

export const systemStore = defineStore('systemStore', {
  state: () => {
    return {
      systemVersion: '2.α.0.0',
      publicIP: '000.111.222.333',
      privateIP: '192.168.000.111'
    }
  }
})