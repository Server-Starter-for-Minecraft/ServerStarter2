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
    /**
     * このプロパティからWorldを呼び出すことで、
     * ワールドオブジェクトに変更が入った場合、直ちに変更が保存される
     */
    world() {
      const world = this.worldList[this.selectedIdx]
      window.API.invokeSetWorld(toRaw(world))
      return world
    },
    /**
     * 選択されているワールドを削除する
     */
    removeWorld() {
      this.worldList.splice(this.selectedIdx, 1)
    }
  },
});
