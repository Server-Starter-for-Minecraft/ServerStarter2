import { useQuasar } from 'quasar';
import { getCacheContents } from 'src/init';
import {
  AllFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import { checkError } from 'src/components/Error/Error';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

type Content = DatapackData | ModData | PluginData;
export type ContentType = 'datapack' | 'plugin' | 'mod';

/**
 * 追加コンテンツの導入・削除・再読み込みの操作
 *
 * カード表示とリスト表示のどちらからも同じ操作を行えるよう、操作をまとめて提供する
 */
export function useContentActions() {
  const $q = useQuasar();
  const mainStore = useMainStore();
  const contentsStore = useContentsStore();

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
   * ServerStarter2を介さずに保存先のフォルダへ直接追加・削除した追加コンテンツを画面に反映する
   */
  async function reloadContents() {
    const world = mainStore.world;
    if (world === undefined) return;

    const res = await window.API.invokeGetWorld(world.id);
    checkError(
      res.value,
      (loaded) => {
        // 読み込み中に別のワールドへ切り替えた場合は反映しない
        if (mainStore.world?.id === loaded.id) {
          mainStore.world.additional = loaded.additional;
        }
      },
      (e) => tError(e)
    );
    await getCacheContents();
  }

  return { addContent, deleteContent, reloadContents };
}
