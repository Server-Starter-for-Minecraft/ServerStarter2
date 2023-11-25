<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import { useMainStore } from 'src/stores/MainStore';
import { RecoverDialogProp } from './iRecoverDialog';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
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
        titleKey: 'utils.errorDialog.recoverFail',
        descKey: `error.${e.key}.title`
      }
    )
  )
  
  // ダイアログを閉じる
  onDialogOK()
}
</script>

<template>
  <!-- TODO: 文言を現在の仕様に適合するように修正 -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading" >
    <BaseDialogCard
      :title="$T('home.backup.recoverFromBackup')"
      :loading="loading"
      :ok-btn-txt="$T('home.backup.startRecover')"
      @ok-click="recoverWorld"
      @close="onDialogCancel"
    >
    <p v-html="
        backupData.time ? 
          $T('home.backup.recoverDialogDate',{date: $d(new Date(Number(backupData.time)), 'dateTime'), world: backupData.name}) : 
          $T('home.backup.recoverDialog',{world: backupData.name})
      " 
    />
    </BaseDialogCard>
  </q-dialog>
</template>