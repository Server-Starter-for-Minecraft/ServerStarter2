<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue';
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
const isShowingMessage = ref(false)
const fadeoutMessage:Ref<EventTarget | undefined> = ref()

async function backupWorld() {
  // ボタンをローディング状態にする
  loading.value = true

  // ワールドを複製
  await window.API.invokeBackupWorld(mainStore.world.id)

  // ボタンの状態をリセット
  loading.value = false
  isShowingMessage.value = true
}

async function recoverWorld() {
  const res = await window.API.invokePickDialog({ type: 'backup' })

  checkError(
    res,
    b => $q.dialog({
      component: RecoverDialog,
      componentProps: {
        backupData: b
      } as RecoverDialogProp
    }),
    () => { return { title: 'バックアップデータの取得に失敗しました' }}
  )
}

// アニメーション終了時のイベントリスナーを登録する
onMounted(() => {
  fadeoutMessage.value?.addEventListener('animationend', () => {
    // fadeクラスを削除する
    isShowingMessage.value = false
  })
})
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
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      @click="recoverWorld"
    />
    <div ref="fadeoutMessage" class="text-primary" :class="isShowingMessage ? 'fade-out' : 'un-visible'">
      {{ mainStore.world.name }}のバックアップの作成に成功しました
    </div>
  </div>
</template>

<style scoped lang="scss">
.un-visible {
  visibility: collapse;
}

.fade-out {
  animation: fadeout .3s ease-in 3s;
}

@keyframes fadeout {
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(20px); }
}
</style>