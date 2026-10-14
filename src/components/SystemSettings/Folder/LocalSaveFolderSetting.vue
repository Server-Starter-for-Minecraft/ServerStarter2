<script setup lang="ts">
import { computed, onMounted, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import {
  listLocalSaveFolders,
  LocalSaveFolder,
  localSaveFolderTitle,
  registerLocalSaveFolder,
  setLocalSaveFolderVisible,
  unregisterLocalSaveFolder,
} from 'app/src-public/scripts/localSaveFolders';
import { tError } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { checkError } from 'src/components/Error/Error';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';
import FolderCardBase from './FolderCardBase.vue';

const { t } = useI18n();
const $q = useQuasar();
const sysStore = useSystemStore();

/** Minecraft Launcherの設定から自動検出した読み込み先 */
const detectedFolders: Ref<string[]> = ref([]);
/**
 * 自動検出が完了したか
 *
 * 完了前は自動検出したフォルダを「追加したフォルダ」と区別できず，
 * 誤った種別のまま登録解除などを操作できてしまうため，完了するまで一覧を表示しない
 */
const detectionLoaded = ref(false);

/** 画面に表示する読み込み先の一覧(自動検出したフォルダ，追加したフォルダの順) */
const folders = computed(() =>
  listLocalSaveFolders(detectedFolders.value, sysStore.systemSettings.localSave)
);

onMounted(async () => {
  try {
    detectedFolders.value =
      await window.API.invokeGetDetectedLocalSaveContainers();
  } catch (e) {
    // 検出に失敗した場合も，追加したフォルダの一覧は操作できるよう読み込み中の表示を解除する
    console.error(e);
    detectedFolders.value = [];
  } finally {
    detectionLoaded.value = true;
  }
});

/**
 * フォルダ選択ダイアログで選んだフォルダを読み込み先に追加する
 */
async function addFolder() {
  const res = await window.API.invokePickDialog({ type: 'container' });
  checkError(
    res,
    (path) => registerLocalSaveFolder(sysStore.systemSettings.localSave, path),
    (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
  );
}

/**
 * 確認ダイアログを表示した上で，読み込み先の登録を解除する(フォルダ自体は削除しない)
 * @param folder 登録を解除する読み込み先
 */
function removeFolder(folder: LocalSaveFolder) {
  const name = localSaveFolderTitle(folder.path);
  $q.dialog({
    component: DangerDialog,
    componentProps: {
      dialogTitle: t('systemsetting.folder.unregistTitle', { name }),
      dialogDesc: t('systemsetting.folder.localSave.unregistDialog', { name }),
      okBtnTxt: t('systemsetting.folder.unregist'),
    } as dangerDialogProp,
  }).onOk(() =>
    unregisterLocalSaveFolder(sysStore.systemSettings.localSave, folder)
  );
}
</script>

<template>
  <div>
    <h1 class="q-mt-none">
      {{ $t('systemsetting.folder.localSave.title') }}
    </h1>
    <p class="q-my-sm text-body2" style="opacity: 0.6; white-space: pre-line">
      {{ $t('systemsetting.folder.localSave.desc') }}
    </p>

    <div v-if="!detectionLoaded" class="row justify-center q-py-md">
      <q-circular-progress indeterminate rounded size="2rem" color="primary" />
    </div>
    <div v-else class="column q-py-sm q-gutter-y-md">
      <template v-for="folder in folders" :key="folder.path">
        <FolderCardBase
          :visible="folder.visible"
          :title="localSaveFolderTitle(folder.path)"
          :path="folder.path"
          :tooltip-visible="$t('systemsetting.folder.localSave.tooltipVisible')"
          :tooltip-invisible="
            $t('systemsetting.folder.localSave.tooltipInvisible')
          "
          @update:visible="
            (v) =>
              setLocalSaveFolderVisible(
                sysStore.systemSettings.localSave,
                folder,
                v
              )
          "
        >
          <template #title-append>
            <q-badge
              v-if="folder.detected"
              outline
              color="primary"
              :label="$t('systemsetting.folder.localSave.detected')"
            />
          </template>
          <template #actions>
            <SsBtn
              free-width
              color="negative"
              :label="$t('systemsetting.folder.unregist')"
              @click="removeFolder(folder)"
            />
          </template>
        </FolderCardBase>
      </template>
      <AddContentsCard
        :label="$t('systemsetting.folder.localSave.add')"
        min-height="4rem"
        :card-style="{ 'min-width': '100%', 'border-radius': '5px' }"
        @click="addFolder"
      />
    </div>
  </div>
</template>
