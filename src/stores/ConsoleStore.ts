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
  getters: {
    status(state) {
      const mainStore = useMainStore()
      return state._world[mainStore.selectedWorldID].status
    },
    console(state) {
      const mainStore = useMainStore()
      return state._world[mainStore.selectedWorldID].console
    }
  },
  actions: {
    setTab() {
      const mainStore = useMainStore()
      if (this._world[mainStore.selectedWorldID] === void 0) {
        this._world[mainStore.selectedWorldID] = {
          status: 'Stop',
          console: new Array<string>()
        }
      }
    },
    setProgress(worldID: WorldID, message: string, current?: number, total?: number) {
      const progressStore = useProgressStore()
      progressStore.setProgress(message, current=current, total=total, worldID=worldID)
      this._world[worldID].status = 'Ready'
    },
    setConsole(worldID: WorldID, consoleLine: string) {
      this._world[worldID].status = 'Running'
      this._world[worldID].console.push(consoleLine)
    },
  }
})

export async function runServer() {
  const mainStore = useMainStore()
  const consoleStore = useConsoleStore()

  consoleStore.setProgress(mainStore.selectedWorldID, '1.19.4 / TestWorld を起動中')
  const res = await window.API.invokeRunServer(toRaw(mainStore.world));

  checkError(res, console.log, 'サーバーが異常終了しました。')
}