import { defineStore } from 'pinia';
import { WorldID } from 'app/src-electron/schema/world';
import { useMainStore } from './MainStore';

interface WorldProgress {
  [id: WorldID]: {
    message: string
    ratio?: number
    selecter?: (value: boolean) => void
  }
}

export const useProgressStore = defineStore('progressStore', {
  state: () => {
    return {
      shwoWorldID: undefined as undefined | WorldID,
      _message: undefined as undefined | string,
      _ratio: undefined as undefined | number,
      _world: {} as WorldProgress
    };
  },
  getters: {
    /**
     * メッセージを取得
     * 
     * ※Storeの_messageを直接参照してはいけない
     */
    message(state) {
      const mainStore = useMainStore()
      return state._message ?? state._world[mainStore.selectedWorldID]?.message ?? ''
    },
    /**
     * 進捗割合を取得
     * 
     * ※Storeの_ratioを直接参照してはいけない
     */
    ratio(state) {
      const mainStore = useMainStore()
      return state._message !== void 0 ? state._ratio : state._world[mainStore.selectedWorldID]?.ratio ?? undefined
    },
    /**
     * ワールドへの同意画面を表示し、ユーザーの選択を受ける
     */
    userSelecter(state) {
      const mainStore = useMainStore()
      return state._message !== void 0 ? undefined : state._world[mainStore.selectedWorldID]?.selecter
    }
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
          ratio: ratio,
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
     * バックエンドからユーザーの選択による処理を要求された場合にイベントに登録しておく処理
     */
    back2frontHandler(resolve: (value: boolean | PromiseLike<boolean>) => void, worldID: WorldID) {
      this._world[worldID].selecter = (value: boolean) => {
        this._world[worldID].selecter = undefined;
        resolve(value);
      };
    }
  }
});