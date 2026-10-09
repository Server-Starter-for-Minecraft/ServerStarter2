import { defineStore } from 'pinia';
import { GroupProgress } from 'app/src-electron/schema/progress';
import { WorldID } from 'app/src-electron/schema/world';

interface WorldProgress {
  [id: WorldID]: {
    title: string;
    progress: GroupProgress;
  };
}

export const useProgressStore = defineStore('progressStore', {
  state: () => {
    return {
      shwoWorldID: undefined as undefined | WorldID,
      _world: {} as WorldProgress,
    };
  },
  actions: {
    /**
     * 登録されているProgressGroupを呼び出す
     */
    getProgress(worldID: WorldID) {
      return this._world[worldID];
    },
    /**
     * プログレス状態を定義する
     *
     * worldIDを指定すると特定のワールドのProgressを記録し、
     * 指定しなければWorldに依存しないProgressとして記録される
     */
    setProgress(worldID: WorldID, progress: GroupProgress) {
      this._world[worldID].progress = progress;
    },
    /**
     * プログレスの初期化を行う
     *
     * プログレスの値をリセットしたいときに利用
     *
     * Worldに依存しないProgressを以降表示しないときにもこれを呼び出す
     */
    initProgress(worldID: WorldID, title: string) {
      this._world[worldID] = {
        title: title,
        progress: {} as GroupProgress,
      };
    },
  },
});
