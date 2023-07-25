<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { CustomMapData } from 'app/src-electron/schema/filedata';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import { CustomMapImporterReturns } from './CustomMapImporter/iCustomMapImporter';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CheckDialog from './CustomMapImporter/checkDialog.vue';
import WorldItem from 'src/components/util/WorldItem.vue';
import { isValid } from 'src/scripts/error';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const $q = useQuasar()
const mainStore = useMainStore()
const localWorlds:Ref<CustomMapData[]> = ref([])

/**
 * 配布ワールドのZip版を導入
 */
async function importZip() {
  const res = await window.API.invokePickDialog({ type: 'world', isFile: true })
  checkError(
    res,
    w => showCheckDialog(w),
    () => { return { title: '配布ワールドの導入に失敗しました' } }
  )
}
/**
 * 配布ワールドのフォルダ版を導入
 */
async function importFolder() {
  const res = await window.API.invokePickDialog({ type: 'world', isFile: false })
  checkError(
    res,
    w => showCheckDialog(w),
    () => { return { title: '配布ワールドの導入に失敗しました' } }
  )
}

/**
 * 配布ワールドで既存のデータを上書きするかの確認を行う
 */
function showCheckDialog(customMap: CustomMapData) {
  // NewWorldの時には確認画面を表示しない
  if (mainStore.newWorlds.has(mainStore.world.id)) {
    onDialogOK({
      customMap: customMap
    } as CustomMapImporterReturns)
    return
  }

  // 確認Dialogの表示
  onDialogHide()
  $q.dialog({
    component: CheckDialog,
    componentProps: {
      customMap: customMap
    } as CustomMapImporterReturns
  }).onOk(() => {
    onDialogOK({
      customMap: customMap
    } as CustomMapImporterReturns)
  }).onCancel(() => {
    onDialogCancel()
  })
}

onMounted(async () => {
  const res = await window.API.invokeGetLocalSaveData()
  checkError(
    res.value,
    lws => localWorlds.value = lws,
    () => { return { title: 'シングルワールドの読み込みに失敗しました' } }
  )
})
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <h1 class="q-pa-none q-ml-md q-pt-sm">
        各種ワールドの導入
      </h1>

      <q-card-section>
        <span class="text-caption">配布ワールドを導入</span>
        <q-card-actions vertical>
          <SsBtn
            free-width
            color="primary"
            icon="add"
            label="ZIPを選択"
            @click="importZip"
            class="btn"
          />
          <SsBtn
            free-width
            color="primary"
            icon="add"
            label="フォルダを選択"
            @click="importFolder"
            class="btn"
          />
        </q-card-actions>
      </q-card-section>

      <q-card-section>
        <span class="text-caption">シングルワールドを導入</span>
        <q-list separator>
          <template v-for="localWorld in localWorlds" :key="localWorld.path">
            <WorldItem :world="localWorld" @click="showCheckDialog(localWorld)" />
          </template>
        </q-list>
      </q-card-section>

      <div class="absolute-top-right">
        <q-btn dense flat round icon="close" size="1rem" class="q-ma-sm" @click="onDialogCancel" />
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.btn {
  font-size: 1rem;
}
</style>