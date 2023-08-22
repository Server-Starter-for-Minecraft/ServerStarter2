<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { RecoverDialogProp } from './iRecoverDialog';
import { checkError } from 'src/components/Error/Error';
import { useMainStore } from 'src/stores/MainStore';
import { $T } from 'src/i18n/utils/tFunc';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const prop = defineProps<RecoverDialogProp>()

const mainStore = useMainStore()
const loading = ref(false)

async function recoverWorld() {
  // ローディング状態にセット
  loading.value = true

  // バックアップデータを反映
  const res = await window.API.invokeRestoreWorld(mainStore.world.id, prop.backupData)

  // 復旧データを画面に反映
  checkError(
    res.value,
    w => mainStore.updateWorld(w),
    () => { return { title: 'バックアップデータからの復旧に失敗しました' }}
  )
  
  // ダイアログを閉じる
  onDialogOK()
}
</script>

<template>
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