import { Component, watch } from 'vue';
import { useRoute } from 'vue-router';
import { DialogChainObject, useQuasar } from 'quasar';
import { WorldID } from 'app/src-electron/schema/world';
import { $T } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import {
  PendingWorldRequest,
  useWorldRequestStore,
  WorldRequestKind,
  WorldRequestTypes,
} from 'src/stores/WorldRequestStore';
import EulaDialog from './EulaDialog.vue';
import { EulaDialogProp } from './iEulaDialog';

/** 要求の種類ごとの、回答を求めるダイアログの設定 */
type PromptSetting<K extends WorldRequestKind> = {
  /**
   * 回答を求めるダイアログ
   *
   * 回答はOKの値として返す（ワールドの切り替えで閉じた場合のキャンセルと区別するため）
   */
  component: Component;
  /** 要求の内容からダイアログに渡すプロパティを生成する */
  props: (payload: WorldRequestTypes[K]['payload']) => object;
  /** ワールド一覧で回答待ちであることを示す文言のi18nキー */
  waitingKey: string;
};

/**
 * 要求の種類ごとの、回答を求めるダイアログの設定
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
 * 回答待ちであることを示す文言を返す
 *
 * @param request 回答待ちの要求
 * @returns ワールド一覧などに表示する文言
 */
export function waitingRequestLabel(request: PendingWorldRequest) {
  return $T(PROMPTS[request.kind].waitingKey);
}

/**
 * バックエンドから求められた回答を求めるダイアログを、該当するワールドを表示している間だけ表示する
 *
 * 複数のワールドで同時に回答を求められた場合でも、どのワールドへの要求かが分かるように、
 * 表示中のワールドが回答を待っている場合にのみダイアログを開き、別のワールドに切り替えた場合や
 * システム設定画面を開いた場合は回答せずにダイアログを閉じる（再度そのワールドを表示した際に改めて表示する）。
 *
 * App.vueのsetup内で一度だけ呼び出す。
 */
export function useWorldRequestPrompt() {
  const $q = useQuasar();
  const route = useRoute();
  const mainStore = useMainStore();
  const requestStore = useWorldRequestStore();

  /** 表示中のダイアログと、その対象のワールド */
  let opened: { worldID: WorldID; dialog: DialogChainObject } | undefined;

  /** 表示中のダイアログを回答せずに閉じる */
  const closeOpened = () => {
    const prev = opened;
    opened = undefined;
    prev?.dialog.hide();
  };

  watch(
    () => {
      const worldID = mainStore.selectedWorldID;
      const isWorldPage = !route.path.startsWith('/system');
      return [worldID, isWorldPage, requestStore.pending(worldID)] as const;
    },
    ([worldID, isWorldPage, request]) => {
      // 別のワールドやシステム設定画面に切り替えた場合は、回答せずにダイアログを閉じる
      if (opened !== undefined && (opened.worldID !== worldID || !isWorldPage))
        closeOpened();

      if (request === undefined || !isWorldPage || opened !== undefined) return;

      const setting = PROMPTS[request.kind] as PromptSetting<WorldRequestKind>;
      const dialog = $q
        .dialog({
          component: setting.component,
          componentProps: setting.props(request.payload),
        })
        .onOk((answer: WorldRequestTypes[typeof request.kind]['answer']) =>
          requestStore.answer(worldID, request.kind, answer)
        )
        .onDismiss(() => {
          if (opened?.dialog === dialog) opened = undefined;
        });
      opened = { worldID, dialog };
    },
    { immediate: true }
  );
}
