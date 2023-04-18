import { defineStore } from 'pinia';

export const progressStore = defineStore('progressStore', {
  state: () => {
    return {
      message: '',
      progressRatio: -1
    }
  }
})