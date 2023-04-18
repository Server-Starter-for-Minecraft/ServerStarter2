import { defineStore } from 'pinia';

export const useConsoleStore = defineStore('consoleStore', {
  state: () => {
    return {
      console: new Array<string>()
    }
  }
})