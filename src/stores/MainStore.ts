import { defineStore } from 'pinia';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedIdx: -1,
      mainTitle: '',
      subTitle: '',
      sideText: '',
      showMenuBtn: false,
      rightDrawerOpen: false,
    }
  },
  actions: {
    setHeader(title: string, { subTitle = '', sideText = '', showMenuBtn = false }) {
      this.mainTitle = title
      this.subTitle = subTitle
      this.sideText = sideText
      this.showMenuBtn = showMenuBtn
    }
  }
})