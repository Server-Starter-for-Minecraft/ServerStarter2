import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { ImageURI, WorldName } from 'app/src-electron/schema/brands';
import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { RemoteWorld } from 'app/src-electron/schema/remote';
import { checkError } from 'src/components/Error/Error';
import { recordKeyFillter, recordValueFilter } from 'src/scripts/objFillter';
import { sortValue } from 'src/scripts/objSort';
import { isError } from 'src/scripts/error';
import { useSystemStore } from './SystemStore';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedWorldID: '' as WorldID,
      inputWorldName: '' as WorldName,
      errorWorlds: new Set<WorldID>(),
      iconCandidate: undefined as ImageURI | undefined,
      gotRemoteWorlds: [] as RemoteWorld[]
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
          worldStore.sortedWorldList,
          wId => worldStore.worldList[wId].name.match(text) !== null
        )
      }
      return worldStore.sortedWorldList;
    },
    /**
     * ワールドを新規作成する
     */
    async createNewWorld() {
      async function creater() {
        // NewWorldを生成
        const world = (await window.API.invokeNewWorld()).value
        if (isError(world)) {
          return world
        }
        // NewWorldを実データに書き出す
        return (await window.API.invokeCreateWorld(world)).value
      }

      const worldStore = useWorldStore()
      // NewWorldをFrontのリストに追加する
      checkError(
        await creater(),
        world => {
          worldStore.worldList[world.id] = toRaw(world)
          this.setWorld(world)
        },
        () => { return { title: '新規ワールドの作成に失敗しました' }}
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
    },
    /**
     * ワールドオブジェクトそのものを更新する
     */
    updateWorld(world: World | WorldEdited) {
      const worldStore = useWorldStore()
      worldStore.worldList[this.selectedWorldID] = world
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
  },
  getters: {
    sortedWorldList(state) {
      const sysStore = useSystemStore()
      const visibleContainers = new Set(sysStore.systemSettings.container.filter(c => c.visible).map(c => c.container))
      return sortValue(
        // 表示設定にしていたコンテナのみを描画対象にする
        recordValueFilter(state.worldList, w => visibleContainers.has(w.container)),
        (a, b) => (a.last_date ?? 0) - (b.last_date ?? 0)
      )
    }
  }
})