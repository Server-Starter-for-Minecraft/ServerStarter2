import { defineStore } from 'pinia';
import { GroupProgress } from 'app/src-electron/schema/progress';
import { WorldID } from 'app/src-electron/schema/world';

interface WorldProgress {
  [id: WorldID]: {
    title: string;
    progress: GroupProgress;
  };
}

/** ユーザーの回答を待っているEULAへの同意の要求 */
interface EulaRequest {
  /** 同意を求めるEULAのURL */
  url: string;
  /** ユーザーの回答（同意したか）をバックエンドへ返す */
  resolve: (agreed: boolean) => void;
}

export const useProgressStore = defineStore('progressStore', {
  state: () => {
    return {
      shwoWorldID: undefined as undefined | WorldID,
      _world: {} as WorldProgress,
      _eulaRequests: {} as Record<WorldID, EulaRequest>,
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
    /**
     * バックエンドから要求されたEULAへの同意を、ユーザーの回答待ちとして登録する
     *
     * 同意の確認は該当するワールドを表示している場合にのみ行うため、回答されるまで保持する
     *
     * @param worldID 起動しようとしているワールド
     * @param url 同意を求めるEULAのURL
     * @returns ユーザーが同意したか
     */
    requestEula(worldID: WorldID, url: string): Promise<boolean> {
      return new Promise<boolean>((resolve) => {
        this._eulaRequests[worldID] = { url, resolve };
      });
    },
    /**
     * EULAへの同意を待っている場合に、同意を求めるEULAのURLを返す
     *
     * @param worldID 対象のワールド
     * @returns 回答待ちのEULAのURL（回答待ちでない場合はundefined）
     */
    waitingEula(worldID: WorldID): string | undefined {
      return this._eulaRequests[worldID]?.url;
    },
    /**
     * EULAへの同意の要求にユーザーの回答を返す
     *
     * @param worldID 対象のワールド
     * @param agreed ユーザーが同意したか
     */
    answerEula(worldID: WorldID, agreed: boolean) {
      const request = this._eulaRequests[worldID];
      if (request === undefined) return;
      delete this._eulaRequests[worldID];
      request.resolve(agreed);
    },
  },
});
