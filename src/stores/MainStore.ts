import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { checkError } from 'src/components/Error/Error';
import { recordKeyFillter } from 'src/scripts/objFillter';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedWorldID: '' as WorldID,
      newWorlds: [] as WorldID[]
    };
  },
  getters: {
    worldList() {
      const worldStore = useWorldStore()
      return worldStore.worldList
    }
  },
  actions: {
    /**
     * 指定したTextをワールド名に含むワールド一覧を取得する
     * Textを指定しない場合は、システム上のワールド一覧を返す
     */
    searchWorld(text: string) {
      if (text !== '') {
        return recordKeyFillter(
          this.worldList,
          wId => this.worldList[wId].name.match(text) !== null
        )
      }
      return this.worldList;
    },
    /**
     * このプロパティからWorldを呼び出すことで、
     * ワールドオブジェクトに変更が入った場合、直ちに変更が保存される
     */
    world() {
      const currentSelectedIdx = this.selectedWorldID
      const world = this.worldList[this.selectedWorldID]
      
      return world
    },
    /**
     * ワールドを新規作成する
     */
    async createNewWorld() {
      checkError(
        (await window.API.invokeNewWorld()).value,
        world => {
          this.worldList[world.id] = toRaw(world)
          this.newWorlds.push(world.id)
          this.selectedWorldID = world.id
        },
        '新規ワールドの作成に失敗しました'
      )
    },
    /**
     * 選択されているワールドを削除する
     */
    removeWorld() {
      delete this.worldList[this.selectedWorldID]
    }
  },
});

/**
 * Worldの変更を検知するためのStore
 * TODO: mainStoreに統合するための方法を検討
 */
export const useWorldStore = defineStore('worldStore', {
  state: () => {
    return {
      worldList: {} as Record<WorldID, WorldEdited>,
    }
  }
})