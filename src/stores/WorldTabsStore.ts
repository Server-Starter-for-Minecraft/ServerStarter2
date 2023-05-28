import { defineStore } from 'pinia';

export const useWorldTabsStore = defineStore('worldTabsStore', {
  state: () => {
    return {
      property: {
        searchName: '',
        selectTab: 'base'
      }
    }
  }
});