import { Component } from 'vue';
import { $T } from 'src/i18n/utils/tFunc';
import {
  PendingWorldRequest,
  WorldRequestKind,
  WorldRequestTypes,
} from 'src/stores/WorldRequestStore';
import EulaDialog from './EulaDialog.vue';
import { EulaDialogProp } from './iEulaDialog';

/** 要求の種類ごとの、回答を求める画面の設定 */
type PromptSetting<K extends WorldRequestKind> = {
  /**
   * 回答を求める画面（カード）
   *
   * ユーザーの回答は`answer`イベントで返す
   */
  component: Component;
  /** 要求の内容から画面に渡すプロパティを生成する */
  props: (payload: WorldRequestTypes[K]['payload']) => object;
  /** ワールド一覧で回答待ちであることを示す文言のi18nキー */
  waitingKey: string;
};

/**
 * 要求の種類ごとの、回答を求める画面の設定
 *
 * 要求の種類を追加する場合はここに追記する
 */
const PROMPTS: { [K in WorldRequestKind]: PromptSetting<K> } = {
  eula: {
    component: EulaDialog,
    props: (payload) => ({ eulaURL: payload.url }) as EulaDialogProp,
    waitingKey: 'eulaDialog.waiting',
  },
};

/**
 * 回答待ちの要求に対応する、回答を求める画面の設定を返す
 *
 * @param request 回答待ちの要求
 * @returns 表示するコンポーネントと、それに渡すプロパティ
 */
export function promptOf(request: PendingWorldRequest) {
  const setting = PROMPTS[request.kind] as PromptSetting<WorldRequestKind>;
  return {
    component: setting.component,
    props: setting.props(request.payload),
  };
}

/**
 * 回答待ちであることを示す文言を返す
 *
 * @param request 回答待ちの要求
 * @returns ワールド一覧などに表示する文言
 */
export function waitingRequestLabel(request: PendingWorldRequest) {
  return $T(PROMPTS[request.kind].waitingKey);
}
