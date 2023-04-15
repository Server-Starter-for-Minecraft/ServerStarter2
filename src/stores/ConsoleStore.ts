import { defineStore } from 'pinia';

export const consoleStore = defineStore('consoleStore', {
  state: () => {
    return {
      console: new Array<string>()
    }
  }
})