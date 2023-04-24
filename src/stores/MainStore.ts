import { World } from 'app/src-electron/api/schema';
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
      worldList: [] as World[],
    };
  },
  actions: {
    setHeader(
      title: string,
      { subTitle = '', sideText = '', showMenuBtn = false }
    ) {
      this.mainTitle = title;
      this.subTitle = subTitle;
      this.sideText = sideText;
      this.showMenuBtn = showMenuBtn;
    },
    showWorldList(text: string) {
      if (text !== '') {
        return this.worldList.filter((world) => world.name.match(text));
      }
      return this.worldList;
    },
  },
});
