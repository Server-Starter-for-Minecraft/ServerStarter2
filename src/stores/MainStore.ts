import { defineStore } from 'pinia';
import { World, WorldSettings } from 'app/src-electron/api/scheme';

/////////////////// demoデータ ///////////////////
const demoWorldSettings: WorldSettings = {
  avater_path: 'https://cdn.quasar.dev/img/parallax2.jpg',
  version: { id: '1.19.2', type: 'vanilla', release: true },
};
const demoWorld: World = {
  name: 'testWorld',
  settings: demoWorldSettings,
  datapacks: [],
  plugins: [],
  mods: [],
};
export const demoWorldList = [...Array(10)].map((_) => demoWorld)
/////////////////////////////////////////////////

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedIdx: -1,
      mainTitle: '',
      subTitle: '',
      sideText: '',
      showMenuBtn: false,
      rightDrawerOpen: false,
      showWorldList: demoWorldList,
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