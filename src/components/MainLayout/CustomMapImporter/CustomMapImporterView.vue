<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';
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
      style="max-width: 50%"
    >
      <q-card-section>
        <span class="text-caption">{{
          $t('mainLayout.customMapImporter.addCustomWorld')
        }}</span>
        <q-card-actions>
          <div class="row full-width q-gutter-sm">
            <SsBtn
              free-width
              color="primary"
              icon="add"
              :label="$t('mainLayout.customMapImporter.selectZip')"
              @click="importZip"
              class="btn col"
            />
            <SsBtn
              free-width
              color="primary"
              icon="add"
              :label="$t('mainLayout.customMapImporter.selectFolder')"
              @click="importFolder"
              class="btn col"
            />
          </div>
        </q-card-actions>
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
          <div
            v-else
            class="absolute-center messageText"
            style="white-space: pre-line"
          >
            {{ $t('mainLayout.customMapImporter.noSingleWorld') }}
          </div>
        </div>
        <div v-else class="row q-gutter-sm justify-center">
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
              style="min-width: 20rem; max-width: 20rem"
            />
          </template>
        </div>
      </q-card-section>
    </BaseDialogCard>
  </q-dialog>
</template>

<style scoped lang="scss">
.btn {
  font-size: 1rem;
  min-width: 12rem;
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
