<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { CustomMapData } from 'app/src-electron/schema/filedata';
import { tError } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import WorldItem from 'src/components/util/WorldItem.vue';
import CheckDialog from './checkDialog.vue';
import { CustomMapImporterProp, importCustomMap } from './iCustomMapImporter';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const $q = useQuasar();
const router = useRouter();
const localWorlds: Ref<CustomMapData[]> = ref([]);
const loading = ref(true);

/**
 * 配布ワールドのZip版を導入
 */
async function importZip() {
  const res = await window.API.invokePickDialog({
    type: 'world',
    isFile: true,
  });
  checkError(
    res,
    (w) => showCheckDialog(w),
    (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
  );
}
/**
 * 配布ワールドのフォルダ版を導入
 */
async function importFolder() {
  const res = await window.API.invokePickDialog({
    type: 'world',
    isFile: false,
  });
  checkError(
    res,
    (w) => showCheckDialog(w),
    (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
  );
}

/**
 * 新規ワールドを生成し，そのワールドを配布ワールドデータに置換する
 */
function showCheckDialog(customMap: CustomMapData) {
  // 確認Dialogの表示
  $q.dialog({
    component: CheckDialog,
    componentProps: {
      icon: customMap.icon,
      worldName: customMap.levelName,
      versionName: customMap.versionName,
      importFunc: async () => await importCustomMap(customMap),
    } as CustomMapImporterProp,
  }).onOk(() => {
    onDialogOK();
  });
}

/** 配布ワールドの導入ボタン */
const importActions = [
  {
    icon: 'folder_zip',
    labelKey: 'mainLayout.customMapImporter.selectZip',
    onClick: importZip,
  },
  {
    icon: 'create_new_folder',
    labelKey: 'mainLayout.customMapImporter.selectFolder',
    onClick: importFolder,
  },
] as const;

/**
 * シングルプレイのワールドの読み込み先を設定するシステム設定の画面へ移動する
 */
function openLocalSaveSetting() {
  onDialogCancel();
  router.push('/system/folder');
}

onMounted(async () => {
  const res = await window.API.invokeGetLocalSaveData();
  checkError(
    res.value,
    (lws) => (localWorlds.value = lws),
    (e) => tError(e)
  );

  // 読み込み処理の終了を通知
  loading.value = false;
});
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('mainLayout.customMapImporter.addSeveralWorld')"
      @close="onDialogCancel"
      style="width: 60vw; max-width: 60rem"
    >
      <q-card-section>
        <span class="text-caption">{{
          $t('mainLayout.customMapImporter.addCustomWorld')
        }}</span>
        <!-- 追加コンテンツの新規導入ボタンと同じデザインにする -->
        <div class="row q-pt-sm q-gutter-sm">
          <SsBtn
            v-for="action in importActions"
            :key="action.labelKey"
            free-width
            color="primary"
            class="col"
            @click="action.onClick"
          >
            <q-icon :name="action.icon" />
            <span class="q-ml-sm">{{ $t(action.labelKey) }}</span>
          </SsBtn>
        </div>
      </q-card-section>

      <q-card-section>
        <span class="text-caption">{{
          $t('mainLayout.customMapImporter.addSingleWorld')
        }}</span>
        <div v-if="localWorlds.length === 0" class="messageField">
          <div v-if="loading" class="absolute-center messageText row">
            <q-circular-progress
              indeterminate
              rounded
              color="grey"
              size="2rem"
              class="q-my-sm q-mr-lg"
            />
            <p style="white-space: pre-line">
              {{ $t('mainLayout.customMapImporter.loadSingleWorld') }}
            </p>
          </div>
          <div v-else class="absolute-center column items-center q-gutter-y-md">
            <div class="messageText" style="white-space: pre-line">
              {{ $t('mainLayout.customMapImporter.noSingleWorld') }}
            </div>
            <SsBtn
              free-width
              icon="settings"
              :label="$t('mainLayout.customMapImporter.openLocalSaveSetting')"
              @click="openLocalSaveSetting"
            />
          </div>
        </div>
        <!-- 余白に応じて列数とアイテムの幅を変え，最小幅を下回る場合は1列で表示する -->
        <div v-else class="world-grid q-pt-sm">
          <template
            v-for="localWorld in localWorlds.sort(
              (w1, w2) => w2.lastPlayed - w1.lastPlayed
            )"
            :key="localWorld.path"
          >
            <WorldItem
              :icon="localWorld.icon"
              :world-name="localWorld.levelName"
              :version-name="localWorld.versionName"
              :last-played="localWorld.lastPlayed"
              @click="showCheckDialog(localWorld)"
            />
          </template>
        </div>
      </q-card-section>
    </BaseDialogCard>
  </q-dialog>
</template>

<style scoped lang="scss">
.world-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 8px;
}

.messageField {
  width: 20rem;
  height: 10rem;
}

.messageText {
  width: max-content;
  font-size: 1rem;
  opacity: 0.6;
}
</style>
