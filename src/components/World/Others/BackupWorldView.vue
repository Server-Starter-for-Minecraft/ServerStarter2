<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import { RecoverDialogProp } from 'src/components/MainLayout/RecoverDialog/iRecoverDialog';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import RecoverDialog from './RecoverDialog/RecoverDialog.vue';

const $q = useQuasar()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const loading = ref(false)
const showingMessage: Ref<string | undefined> = ref()
const fadeoutMessageRef: Ref<EventTarget | undefined> = ref()

async function backupWorld() {
  // ボタンをローディング状態にする
  loading.value = true

  // ワールドを複製
  await window.API.invokeBackupWorld(mainStore.world.id)

  // ボタンの状態をリセット
  loading.value = false
  showingMessage.value = $T('others.backup.madeBackup',{world: mainStore.world.name})
}

async function recoverWorld() {
  const res = await window.API.invokePickDialog({ type: 'backup', container: mainStore.world.container })

  checkError(
    res,
    b => $q.dialog({
      component: RecoverDialog,
      componentProps: {
        backupData: b
      } as RecoverDialogProp
    }).onOk(() => {
      showingMessage.value = $T('others.backup.recovered')
    }),
    e => tError(e, {ignoreErrors: ['data.path.dialogCanceled']})
  )
}

// アニメーション終了時のイベントリスナーを登録する
onMounted(() => {
  fadeoutMessageRef.value?.addEventListener('animationend', () => {
    // fadeクラスを削除する
    showingMessage.value = undefined
  })
})
</script>

<template>
  <p 
    class="text-caption q-mt-md" 
    style="opacity: .6;"
    v-html="$T('others.backup.backupDesc')"
  >  
  </p>
  <div class="row items-center q-gutter-md">
    <SsBtn
      :label="$T('others.backup.makeBackup')"
      :loading="loading"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      @click="backupWorld"
    />
    <SsBtn
      :label="$T('others.backup.recoverFromBackup')"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      @click="recoverWorld"
    />
    <div ref="fadeoutMessageRef" class="text-primary" :class="showingMessage ? 'fade-out' : 'un-visible'">
      {{ showingMessage }}
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