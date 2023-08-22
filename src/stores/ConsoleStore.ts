import { defineStore } from 'pinia';
import { WorldID } from 'app/src-electron/schema/world';
import { useProgressStore } from './ProgressStore';
import { useMainStore } from './MainStore';
import { checkError } from 'src/components/Error/Error';
import { assets } from 'src/assets/assets';
import { values } from 'src/scripts/obj';
import { isValid } from 'src/scripts/error';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { useI18n } from 'vue-i18n';

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
    initProgress(worldID: WorldID, message: string) {
      const progressStore = useProgressStore()
      progressStore.initProgress(worldID, message)
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
     * 全てのワールドが停止中か否かを返す
     */
    isAllWorldStop() {
      return values(this._world).every(obj => obj.status === 'Stop')
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

  // 画像が入っていない場合は既定のアイコンを適用する
  if (mainStore.world.avater_path === void 0) {
    mainStore.world.avater_path = assets.png.unset
  }

  // プログレスのステータスをセットして起動
  consoleStore.initProgress(
    mainStore.selectedWorldID,
    //`${mainStore.world.version.id} (${mainStore.world.version.type}) / ${mainStore.world.name} を起動中`
    $T(
      'console.booting',
      {
        id: `${mainStore.world.version.id}`,
        type:`${$T(`home.serverType.${mainStore.world.version.type}`)}`,
        name:`${mainStore.world.name}`
      }
    )
  )
  const res = await window.API.invokeRunWorld(mainStore.selectedWorldID);

  // サーバー終了時のエラー確認
  checkError(res.value, undefined, e=>tError(e))

  // サーバータブをリセット
  consoleStore.initTab(true)
}