import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { getCacheContents } from 'src/init';
import {
  AllFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import { checkError } from 'src/components/Error/Error';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';
import { mergeReloadedContents } from './contentReload';

type Content = DatapackData | ModData | PluginData;
export type ContentType = 'datapack' | 'plugin' | 'mod';

/**
 * 追加コンテンツを保存先から読み込み直している最中か
 *
 * 読み込み中に導入・削除すると、読み込み結果で操作が上書きされるおそれがあるため、
 * 読み込み中は各画面で導入・削除の操作を受け付けない
 */
const reloading = ref(false);

/**
 * 追加コンテンツの導入・削除・再読み込みの操作
 *
 * カード表示とリスト表示のどちらからも同じ操作を行えるよう、操作をまとめて提供する
 */
export function useContentActions() {
  const $q = useQuasar();
  const mainStore = useMainStore();
  const contentsStore = useContentsStore();
  const consoleStore = useConsoleStore();

  /** 表示中のワールドに導入されている追加コンテンツの一覧 */
  const installed = (type: ContentType) =>
    mainStore.world?.additional[`${type}s`] as
      AllFileData<Content>[] | undefined;

  /**
   * 追加コンテンツを表示中のワールドに導入する
   *
   * @param type 追加コンテンツの種類
   * @param content 導入する追加コンテンツ
   */
  function addContent(type: ContentType, content: AllFileData<Content>) {
    installed(type)?.push(content);
  }

  /**
   * 追加コンテンツを表示中のワールドから削除する
   *
   * 起動履歴のあるワールドから削除するとワールドデータが破損する恐れがあるため、
   * ワールドの起動前に登録された追加コンテンツの場合は確認のダイアログを表示する
   *
   * @param type 追加コンテンツの種類
   * @param content 削除する追加コンテンツ
   */
  function deleteContent(type: ContentType, content: AllFileData<Content>) {
    function __delete() {
      const list = installed(type);
      const idx = list?.findIndex((c) => c.name === content.name) ?? -1;
      if (idx >= 0) list?.splice(idx, 1);
    }

    // 起動前に登録された追加コンテンツに対して警告を出さない
    if (contentsStore.isNewContents(content)) {
      __delete();
      return;
    }
    $q.dialog({
      component: DangerDialog,
      componentProps: {
        dialogTitle: $T('additionalContents.deleteDialog.title', { type }),
        dialogDesc: $T('additionalContents.deleteDialog.desc', { type }),
        okBtnTxt: $T('additionalContents.deleteDialog.okbtn'),
      } as dangerDialogProp,
    }).onOk(() => __delete());
  }

  /**
   * 表示中のワールドの追加コンテンツと、導入履歴のある追加コンテンツを保存先から読み込み直す
   *
   * ServerStarter2を介さずに保存先のフォルダへ直接追加・削除した追加コンテンツを画面に反映する。
   * 変化があった場合のみワールドのデータを更新し、不要なワールドの保存処理を発生させない。
   */
  async function reloadContents() {
    const world = mainStore.world;
    if (world === undefined || reloading.value) return;

    reloading.value = true;
    try {
      const res = await window.API.invokeGetWorldContents(world.id);
      checkError(
        res.value,
        (loaded) => {
          // 読み込み中に別のワールドへ切り替えた場合は反映しない
          const current = mainStore.world;
          if (current?.id !== world.id) return;

          const types = ['datapacks', 'plugins', 'mods'] as const;
          for (const key of types) {
            const merged = mergeReloadedContents<AllFileData<Content>>(
              current.additional[key] as AllFileData<Content>[],
              loaded[key] as AllFileData<Content>[]
            );
            if (!merged.changed) continue;
            (current.additional[key] as AllFileData<Content>[]) =
              merged.contents;

            // 停止中は「ワールド起動前のデータ」にも反映し、保存先にあるコンテンツを導入済みとして扱う
            // （起動履歴があり得るコンテンツの削除時に警告を表示するため）
            const back = mainStore.worldBack;
            if (back && consoleStore.status(world.id) === 'Stop') {
              (back.additional[key] as AllFileData<Content>[]) = [
                ...(loaded[key] as AllFileData<Content>[]),
              ];
            }
          }
        },
        (e) => tError(e)
      );
      await getCacheContents();
    } finally {
      reloading.value = false;
    }
  }

  return { addContent, deleteContent, reloadContents, reloading };
}
