import { defineStore } from 'pinia';
import { WorldID } from 'app/src-electron/schema/world';
import { useMainStore } from './MainStore';

interface WorldProgress {
  [id: WorldID]: {
    message: string
    ratio?: number
  }
}

const mainStore = useMainStore()

export const useProgressStore = defineStore('progressStore', {
  state: () => {
    return {
      shwoWorldID: undefined as undefined | WorldID,
      _message: undefined as undefined | string,
      _ratio: undefined as undefined | number,
      _world: {} as WorldProgress
    };
  },
  actions: {
    /**
     * プログレス状態を定義する
     * 
     * worldIDを指定すると特定のワールドのProgressを記録し、
     * 指定しなければWorldに依存しないProgressとして記録される
     */
    setProgress(message: string , current?: number, total?: number, worldID?: WorldID) {
      const isUndefined = current === void 0 || total === void 0
      const ratio = isUndefined ? undefined : current / total

      if (worldID === void 0) {
        this._message = message
        this._ratio = ratio
      }
      else {
        this._world[worldID] = {
          message: message,
          ratio: ratio
        }
      }
    },
    /**
     * プログレスの初期化を行う
     * 
     * プログレスの値をリセットしたいときに利用
     * 
     * Worldに依存しないProgressを以降表示しないときにもこれを呼び出す
     */
    initProgress(worldID?: WorldID) {
      if (worldID === void 0) {
        this._message = undefined
        this._ratio = undefined
      }
      else {
        this._world[worldID].message = ''
        this._world[worldID].ratio = undefined
      }
    },
    /**
     * メッセージを取得
     * 
     * ※Storeの_messageを直接参照してはいけない
     */
    message() {
      return this._message ?? this._world[mainStore.selectedWorldID]?.message ?? ''
    },
    /**
     * 進捗割合を取得
     * 
     * ※Storeの_ratioを直接参照してはいけない
     */
    ratio() {
      return this._message !== void 0 ? this._ratio : this._world[mainStore.selectedWorldID]?.ratio ?? undefined
    }
  }
});