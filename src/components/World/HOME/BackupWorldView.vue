<script setup lang="ts">
import { ref } from 'vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import { checkError } from 'src/components/Error/Error';
import { useQuasar } from 'quasar';
import RecoverDialog from './RecoverDialog/RecoverDialog.vue';
import { RecoverDialogProp } from './RecoverDialog/iRecoverDialog';

const $q = useQuasar()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const loading = ref(false)

async function backupWorld() {
  // ボタンをローディング状態にする
  loading.value = true

  // ワールドを複製
  await window.API.invokeBackupWorld(mainStore.world.id)

  // ボタンの状態をリセット
  loading.value = false
}

async function recoverWorld() {
  const res = await window.API.invokePickDialog({ type: 'backup' })

  checkError(
    res,
    b => $q.dialog({
      component: RecoverDialog,
      componentProps: {
        worldID: mainStore.world.id,
        backupData: b
      } as RecoverDialogProp
    }),
    () => { return { title: 'バックアップデータの取得に失敗しました' }}
  )
}
</script>

<template>
  <p class="text-caption q-mt-md" style="opacity: .6;">
    このワールドのバックアップを作成します<br>
    バックアップしたワールドデータは「バックアップから復旧」より利用することができます
  </p>
  <div class="row items-center q-gutter-md">
    <SsBtn
      label="バックアップを作成"
      :loading="loading"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      @click="backupWorld"
    />
    <SsBtn
      label="バックアップから復旧"
      :loading="loading"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      @click="recoverWorld"
    />
    <div class="text-primary q-ml-sm fade-out">
      {{ mainStore.world.name }}のバックアップの作成に成功しました
    </div>
  </div>
</template>