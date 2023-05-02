import { World } from 'app/src-electron/api/schema';
import { defineStore } from 'pinia';

export interface Drawer {
  icon: string
  label: string
  separator: boolean
}

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedIdx: -1,
      mainTitle: '',
      subTitle: '',
      sideText: '',
      showMenuBtn: false,
      leftDrawerOpen: false,
      drawerContents: [] as Drawer[],
      worldList: [] as World[],
    };
  },
  actions: {
    setHeader(
      title: string,
      { subTitle = '', sideText = '', drawerContents = [] as Drawer[] }
    ) {
      this.mainTitle = title;
      this.subTitle = subTitle;
      this.sideText = sideText;
      this.showMenuBtn = drawerContents.length !== 0;
      this.leftDrawerOpen = drawerContents.length !== 0;
      this.drawerContents = drawerContents;
    },
    searchWorld(text: string) {
      if (text !== '') {
        return this.worldList.filter((world) => world.name.match(text));
      }
      return this.worldList;
    },
  },
});
