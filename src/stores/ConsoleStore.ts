import { defineStore } from 'pinia';

const consoleStore = defineStore('consoleStore', {
  state: () => {
    return {
        console: new Array<string>()
    }
  },
  getters: {
    Console(state) {
      return state.console
    }
  }
})

export function addConsole(text:string) {
    consoleStore().console.push(text)
}

export function getStore() {
    return consoleStore()
}