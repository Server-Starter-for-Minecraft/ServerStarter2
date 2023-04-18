import { defineStore } from 'pinia';

export const mainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedIdx: -1,
      mainTitle: '',
      subTitle: '',
      sideText: ''
    }
  },
  actions: {
    setHeader(title: string, {subTitle = '', sideText = ''}) {
      this.mainTitle = title
      this.subTitle = subTitle
      this.sideText = sideText
    }
  }
})