import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { WorldEdited } from 'app/src-electron/schema/world';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedIdx: 0,
      worldList: [] as WorldEdited[],
    };
  },
  getters: {
    /**
     * このプロパティからWorldを呼び出すことで、
     * ワールドオブジェクトに変更が入った場合、直ちに変更が保存される
     */
    world(state) {
      const world = state.worldList[state.selectedIdx]
      window.API.invokeSaveWorldSettings(toRaw(world))
      return world
    },
    selectedWorldID(state) {
      return state.worldList[state.selectedIdx].id
    }
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
