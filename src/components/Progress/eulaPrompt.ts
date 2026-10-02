import { watch } from 'vue';
import { DialogChainObject, useQuasar } from 'quasar';
import { WorldID } from 'app/src-electron/schema/world';
import { useMainStore } from 'src/stores/MainStore';
import { useProgressStore } from 'src/stores/ProgressStore';
import EulaDialog from './EulaDialog.vue';
import { EulaDialogProp } from './iEulaDialog';

/**
 * EULAへの同意を求めるダイアログを、該当するワールドを表示している間だけ表示する
 *
 * 複数のワールドで同時に同意を求められた場合でも、どのワールドへの同意かが分かるように、
 * 表示中のワールドが同意を待っている場合にのみダイアログを開き、別のワールドに切り替えた場合は
 * 回答せずにダイアログを閉じる（再度そのワールドを表示した際に改めて表示する）。
 *
 * App.vueのsetup内で一度だけ呼び出す。
 */
export function useEulaPrompt() {
  const $q = useQuasar();
  const mainStore = useMainStore();
  const progressStore = useProgressStore();

  /** 表示中のダイアログと、その対象のワールド */
  let opened: { worldID: WorldID; dialog: DialogChainObject } | undefined;

  watch(
    () => {
      const worldID = mainStore.selectedWorldID;
      return [worldID, progressStore.waitingEula(worldID)] as const;
    },
    ([worldID, eulaURL]) => {
      // 別のワールドに切り替えた場合は、回答せずにダイアログを閉じる
      if (opened !== undefined && opened.worldID !== worldID) {
        const prev = opened;
        opened = undefined;
        prev.dialog.hide();
      }

      if (eulaURL === undefined || opened !== undefined) return;

      const dialog = $q
        .dialog({
          component: EulaDialog,
          componentProps: { eulaURL } as EulaDialogProp,
        })
        // ダイアログを閉じただけ（ワールドの切り替え）の場合と区別するため、回答はOKの値で受け取る
        .onOk((agreed: boolean) => progressStore.answerEula(worldID, agreed))
        .onDismiss(() => {
          if (opened?.dialog === dialog) opened = undefined;
        });
      opened = { worldID, dialog };
    },
    { immediate: true }
  );
}
