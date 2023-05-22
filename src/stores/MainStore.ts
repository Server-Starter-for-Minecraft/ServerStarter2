import { WorldEdited } from 'app/src-electron/schema/world';
import { defineStore } from 'pinia';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedIdx: -1,
      leftDrawerOpen: true,
      worldList: [] as WorldEdited[],
    };
  },
  actions: {
    searchWorld(text: string) {
      if (text !== '') {
        return this.worldList.filter((world) => world.name.match(text));
      }
      return this.worldList;
    },
  },
});
