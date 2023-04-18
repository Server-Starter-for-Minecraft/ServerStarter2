import { defineStore } from 'pinia';

export const useProgressStore = defineStore('progressStore', {
  state: () => {
    return {
      message: '',
      progressRatio: undefined as undefined | number,
    };
  },
});
