<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { RecoverDialogProp } from './iRecoverDialog';
import { checkError } from 'src/components/Error/Error';
import { useMainStore } from 'src/stores/MainStore';

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
      title="バックアップから復旧"
      :loading="loading"
      ok-btn-txt="復旧を開始"
      @ok-click="recoverWorld"
      @close="onDialogCancel"
    >
      <!-- TODO: BackupDataが更新され次第，変数を埋め込む -->
      <p>
        【日時】に作成された【ワールド名】を現在の既存ワールドに導入します<br>
        既存ワールドをバックアップのワールドで上書きしますか？
      </p>
    </BaseDialogCard>
  </q-dialog>
</template>