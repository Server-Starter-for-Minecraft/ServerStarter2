<script setup lang="ts">
import { ref } from 'vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import { checkError } from 'src/components/Error/Error';
import { useQuasar } from 'quasar';
import RecoverDialog from './RecoverDialog/RecoverDialog.vue';

const $q = useQuasar()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const loading = ref(false)
const progressCounter = ref(0)

async function backupWorld() {
  // ボタンをローディング所帯にする
  loading.value = true

  // ワールドを複製
  await window.API.invokeBackupWorld(mainStore.world.id)

  // ボタンの状態をリセット
  loading.value = false
  countupProgress()
}

async function recoverWorld() {
  const res = await window.API.invokePickDialog({ type: 'backup' })

  checkError(
    res,
    b => $q.dialog({
      component: RecoverDialog
    })
  )
}

function countupProgress() {
  progressCounter.value += 1
  if (progressCounter.value < 110) {
    setTimeout(countupProgress, 100)
  }
  else {
    progressCounter.value = 0
  }
}
</script>

<template>
  <p class="text-caption q-mt-md" style="opacity: .6;">
    このワールドのバックアップを作成します<br>
    バックアップしたワールドデータはこの画面上部の「既存ワールドの選択」より復旧データとして利用することができます
  </p>
  <div class="row items-center q-gutter-md">
    <SsBtn
      label="バックアップを作成"
      :loading="loading"
      :disable="loading || consoleStore.status(mainStore.world.id) !== 'Stop'"
      @click="backupWorld"
    />
    <SsBtn
      label="バックアップから復旧"
      :loading="loading"
      :disable="loading || consoleStore.status(mainStore.world.id) !== 'Stop'"
      @click="recoverWorld"
    />
    <div v-if="progressCounter !== 0" class="row items-center">
      <q-circular-progress
        :value="progressCounter"
        :thickness="0.1"
        size="1.5rem"
        show-value
        color="primary"
      >
        <q-avatar size="2rem">
          <q-icon name="check" color="primary" />
        </q-avatar>
      </q-circular-progress>
      <div class="text-primary q-ml-sm">
        {{ mainStore.world.name }}のバックアップの作成に成功しました
      </div>
    </div>
  </div>
</template>