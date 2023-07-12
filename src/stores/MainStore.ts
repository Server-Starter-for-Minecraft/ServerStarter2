import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { ImageURI, WorldName } from 'app/src-electron/schema/brands';
import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { checkError } from 'src/components/Error/Error';
import { recordKeyFillter } from 'src/scripts/objFillter';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedWorldID: '' as WorldID,
      inputWorldName: '' as WorldName,
      newWorlds: [] as WorldID[],
      iconCandidate: undefined as ImageURI | undefined
    };
  },
  getters: {
    world(state) {
      const worldStore = useWorldStore()
      return worldStore.worldList[state.selectedWorldID]
    }
  },
  actions: {
    /**
     * 指定したTextをワールド名に含むワールド一覧を取得する
     * Textを指定しない場合は、システム上のワールド一覧を返す
     */
    searchWorld(text: string) {
      const worldStore = useWorldStore()

      if (text !== '') {
        return recordKeyFillter(
          worldStore.worldList,
          wId => worldStore.worldList[wId].name.match(text) !== null
        )
      }
      return worldStore.worldList;
    },
    /**
     * ワールドを新規作成する
     */
    async createNewWorld() {
      const worldStore = useWorldStore()

      checkError(
        (await window.API.invokeNewWorld()).value,
        world => {
          worldStore.worldList[world.id] = toRaw(world)
          this.newWorlds.push(world.id)
          this.setWorld(world)
        },
        '新規ワールドの作成に失敗しました'
      )
    },
    /**
     * 選択されているワールドを削除する
     */
    removeWorld() {
      const worldStore = useWorldStore()
      delete worldStore.worldList[this.selectedWorldID]
    },
    /**
     * ワールドIDで設定したワールドを表示する
     */
    setWorld(world: World | WorldEdited) {
      this.selectedWorldID = world.id
      this.inputWorldName = world.name
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