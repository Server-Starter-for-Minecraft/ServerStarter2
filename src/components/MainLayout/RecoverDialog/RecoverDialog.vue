<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import { useMainStore } from 'src/stores/MainStore';
import { RecoverDialogProp } from './iRecoverDialog';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';

defineEmits({ ...useDialogPluginComponent.emitsObject })
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const prop = defineProps<RecoverDialogProp>()

const mainStore = useMainStore()
const loading = ref(false)

async function recoverWorld() {
  // ローディング状態にセット
  loading.value = true

  // バックアップデータを反映
  await mainStore.createNewWorld()
  const res = await window.API.invokeRestoreWorld(mainStore.world.id, prop.backupData)

  // 復旧データを画面に反映
  checkError(
    res.value,
    w => mainStore.updateWorld(w),
    e => tError(
      e,
      {
        titleKey: 'error.errorDialog.recoverFail',
        descKey: `error.${e.key}.title`
      }
    )
  )

  // ダイアログを閉じる
  onDialogOK()
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading">
    <BaseDialogCard :title="$T('mainLayout.backupDialog.title')" :loading="loading" :ok-btn-txt="$T('mainLayout.backupDialog.startRecover')"
      @ok-click="recoverWorld" @close="onDialogCancel">
      <p>{{ $t('mainLayout.backupDialog.desc') }}</p>
      <ul>
        <li>{{ $T('mainLayout.backupDialog.backupName', { world: backupData.name }) }}</li>
        <li>
          {{ $T('mainLayout.backupDialog.date', {
            date: backupData.time ? $d(new Date(backupData.time), 'dateTime') : $t('mainLayout.backupDialog.failedDate')
          }) }}
        </li>
      </ul>
    </BaseDialogCard>
  </q-dialog>
</template>