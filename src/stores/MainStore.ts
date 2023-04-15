import { defineStore } from 'pinia';

export const mainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedIdx: -1,
    }
  }
})