import { toRaw } from 'vue';
import { defineStore } from 'pinia';
import { WorldName } from 'app/src-electron/schema/brands';
import { Version } from 'app/src-electron/schema/version';
import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { checkError } from 'src/components/Error/Error';
import { recordKeyFillter, recordValueFilter } from 'src/scripts/objFillter';
import { sortValue } from 'src/scripts/objSort';
import { isError, isValid } from 'src/scripts/error';
import { useSystemStore } from './SystemStore';
import { useConsoleStore } from './ConsoleStore';
import { assets } from 'src/assets/assets';
import { tError } from 'src/i18n/utils/tFunc';

export const useMainStore = defineStore('mainStore', {
  state: () => {
    return {
      selectedWorldID: '' as WorldID,
      inputWorldName: '' as WorldName,
      errorWorlds: new Set<WorldID>(),
      selectedVersionType: 'vanilla' as Version['type']
    };
  },
  getters: {
    world(state) {
      const worldStore = useWorldStore()
      const returnWorld = worldStore.worldList[state.selectedWorldID]

      // バージョンの更新（ワールドを選択し直すタイミングでバージョンの変更を反映）
      state.selectedVersionType = returnWorld.version.type

      return returnWorld
    },
    worldIP(state) {
      const worldStore = useWorldStore()
      return worldStore.worldIPs[state.selectedWorldID]
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
    async createNewWorld(duplicateWorldID?: WorldID) {
      async function createrNew() {
        // NewWorldを生成
        const world = (await window.API.invokeNewWorld()).value
        if (isError(world)) {
          return world
        }

        // set default icon
        world.avater_path = assets.png.unset

        // set owner player
        const ownerPlayer = useSystemStore().systemSettings.user.owner
        if (ownerPlayer) {
          const res = await window.API.invokeGetPlayer(ownerPlayer, 'uuid')
          checkError(
            res,
            p => {
              if (isValid(world.players)) {
                world.players.push({
                  name: p.name,
                  uuid: p.uuid,
                  op: { level: 4, bypassesPlayerLimit: false }
                })
              }
            },
            e => tError(e, { titleKey: 'error.errorDialog.failOPForOwner', descKey: `error.${e.key}.title` })
          )
        }

        // NewWorldを実データに書き出す
        return (await window.API.invokeCreateWorld(world)).value
      }

      async function createrDuplicate(_duplicateWorldID: WorldID) {
        return (await window.API.invokeDuplicateWorld(_duplicateWorldID)).value
      }

      const worldStore = useWorldStore()
      const consoleStore = useConsoleStore()
      // NewWorldをFrontのリストに追加する
      const res = await (duplicateWorldID ? createrDuplicate(duplicateWorldID) : createrNew())
      checkError(
        res,
        world => {
          worldStore.worldList[world.id] = toRaw(world)
          this.setWorld(world)
          consoleStore.initTab(world.id)
        },
        e => tError(e)
      )
    },
    /**
     * 選択されているワールドを削除する
     */
    removeWorld(worldID: WorldID) {
      const worldStore = useWorldStore()
      delete worldStore.worldList[worldID]
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
      worldStore.worldList[world.id] = world
    },
    /**
     * Ngrokより割り当てられたIPアドレスを削除する（サーバー終了時を想定）
     */
    removeWorldIP(worldID: WorldID) {
      const worldStore = useWorldStore()
      worldStore.removeWorldIP(worldID)
    }
  },
});

/**
 * Worldの変更を検知するためのStore
 */
export const useWorldStore = defineStore('worldStore', {
  state: () => {
    return {
      worldList: {} as Record<WorldID, WorldEdited>,
      worldIPs: {} as Record<WorldID, string>
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
  },
  actions: {
    setWorldIP(worldID: WorldID, ip?: string) {
      if (ip && ip !== '') {
        this.worldIPs[worldID] = ip
      }
    },
    removeWorldIP(worldID: WorldID) {
      delete this.worldIPs[worldID]
    }
  }
})