import { defineStore } from 'pinia';
import { WorldID } from 'app/src-electron/schema/world';
import { useProgressStore } from './ProgressStore';
import { useMainStore } from './MainStore';
import { toRaw } from 'vue';
import { checkError } from 'src/components/Error/Error';

interface WorldConsole {
  [id: WorldID]: {
    status: 'Stop' | 'Ready' | 'Running'
    console: string[]
  }
}

export const useConsoleStore = defineStore('consoleStore', {
  state: () => {
    return {
      _world: {} as WorldConsole
    }
  },
  actions: {
    /**
     * コンソールを表示するために必要な情報を宣言
     * 
     * mainStoreのSelectedIdxを変更してから呼び出す
     * 
     * @param force すでにデータが存在していてもコンソールとステータスを初期化する
     */
    initTab(force = false) {
      const mainStore = useMainStore()
      if (this._world[mainStore.selectedWorldID] === void 0 || force) {
        this._world[mainStore.selectedWorldID] = {
          status: 'Stop',
          console: new Array<string>()
        }
      }
    },
    /**
     * 進捗を登録する
     */
    setProgress(worldID: WorldID, message: string, current?: number, total?: number) {
      const progressStore = useProgressStore()
      progressStore.setProgress(message, current=current, total=total, worldID=worldID)
      this._world[worldID].status = 'Ready'
    },
    /**
     * コンソールに行を追加する 
     */
    setConsole(worldID: WorldID, consoleLine?: string) {
      this._world[worldID].status = 'Running'
      if (consoleLine !== void 0) { this._world[worldID].console.push(consoleLine) }
    },
    /**
     * ワールドの実行状態を取得する
     */
    status(worldID?: WorldID) {
      const id = worldID ?? useMainStore().selectedWorldID
      return this._world[id]?.status ?? 'Stop'
    },
    /**
     * ワールドのコンソール状態を取得する
     */
    console(worldID?: WorldID) {
      const id = worldID ?? useMainStore().selectedWorldID
      return this._world[id].console
    }
  }
})

export async function runServer() {
  const mainStore = useMainStore()
  const consoleStore = useConsoleStore()

  consoleStore.setProgress(mainStore.selectedWorldID, '1.19.4 / TestWorld を起動中')
  const res = await window.API.invokeRunServer(toRaw(mainStore.world()));

  checkError(res, console.log, 'サーバーが異常終了しました。')

  // サーバータブをリセット
  consoleStore.initTab(true)
}