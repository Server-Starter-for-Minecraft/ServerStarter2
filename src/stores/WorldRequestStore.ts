import { defineStore } from 'pinia';
import { WorldID } from 'app/src-electron/schema/world';

/**
 * バックエンドからワールドごとに求められる、ユーザーの回答が必要な要求の種類
 *
 * 要求の種類を追加する場合は、ここに要求の内容（payload）と回答（answer）の型を追記し、
 * `CANCELED_ANSWERS` と `src/components/Progress/worldRequestPrompt.ts` に対応する設定を追加する
 */
export type WorldRequestTypes = {
  /** Minecraft EULAへの同意（回答は同意したか） */
  eula: { payload: { url: string }; answer: boolean };
};
export type WorldRequestKind = keyof WorldRequestTypes;
type Payload<K extends WorldRequestKind> = WorldRequestTypes[K]['payload'];
type Answer<K extends WorldRequestKind> = WorldRequestTypes[K]['answer'];

/** ユーザーの回答を待っている要求 */
export type PendingWorldRequest = {
  [K in WorldRequestKind]: { kind: K; payload: Payload<K> };
}[WorldRequestKind];

/**
 * ユーザーが回答しないまま要求が取り消された場合に、バックエンドへ返す回答
 *
 * バックエンドが回答を待ち続けないよう、要求の種類ごとに「拒否」にあたる値を定める
 */
const CANCELED_ANSWERS: { [K in WorldRequestKind]: Answer<K> } = {
  eula: false,
};

type StoredRequest = PendingWorldRequest & {
  resolve: (answer: Answer<WorldRequestKind>) => void;
};

/**
 * バックエンドから求められた、ユーザーの回答待ちの要求をワールドごとに保持するStore
 *
 * 回答を求める画面は該当するワールドを表示している場合にのみ表示するため、回答されるまで要求を保持する
 */
export const useWorldRequestStore = defineStore('worldRequestStore', {
  state: () => {
    return {
      _requests: {} as Record<WorldID, StoredRequest>,
    };
  },
  actions: {
    /**
     * ユーザーの回答待ちの要求を登録する
     *
     * 同じワールドに回答待ちの要求が既にある場合は、その要求を取り消してから登録する
     *
     * @param worldID 回答を求めるワールド
     * @param kind 要求の種類
     * @param payload 要求の内容
     * @returns ユーザーの回答
     */
    request<K extends WorldRequestKind>(
      worldID: WorldID,
      kind: K,
      payload: Payload<K>
    ): Promise<Answer<K>> {
      this.cancel(worldID);
      return new Promise<Answer<K>>((resolve) => {
        this._requests[worldID] = {
          kind,
          payload,
          resolve,
        } as StoredRequest;
      });
    },
    /**
     * ワールドの回答待ちの要求を取得する
     *
     * @param worldID 対象のワールド
     * @returns 回答待ちの要求（回答待ちでない場合はundefined）
     */
    pending(worldID: WorldID): PendingWorldRequest | undefined {
      const request = this._requests[worldID];
      if (request === undefined) return undefined;
      return { kind: request.kind, payload: request.payload };
    },
    /**
     * 回答待ちの要求にユーザーの回答を返す
     *
     * @param worldID 対象のワールド
     * @param kind 回答する要求の種類（回答待ちの要求と種類が異なる場合は何もしない）
     * @param answer ユーザーの回答
     */
    answer<K extends WorldRequestKind>(
      worldID: WorldID,
      kind: K,
      answer: Answer<K>
    ) {
      const request = this._requests[worldID];
      if (request === undefined || request.kind !== kind) return;
      delete this._requests[worldID];
      request.resolve(answer);
    },
    /**
     * 回答待ちの要求を、ユーザーが回答しなかったものとして取り消す
     *
     * @param worldID 対象のワールド
     */
    cancel(worldID: WorldID) {
      const request = this._requests[worldID];
      if (request === undefined) return;
      delete this._requests[worldID];
      request.resolve(CANCELED_ANSWERS[request.kind]);
    },
  },
});
