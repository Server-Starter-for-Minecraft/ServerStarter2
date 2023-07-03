<script setup lang="ts">
import { toRaw, watch } from 'vue';
import { useRouter } from 'vue-router'
import { initWindow, afterWindow } from 'app/src/init';
import { useProgressStore } from 'src/stores/ProgressStore';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import ProgressPage from './ProgressPage.vue';
import { storeToRefs } from 'pinia';

const progressStore = useProgressStore()
progressStore.setProgress('ServerStarter2を起動中')

const router = useRouter()

// 起動時処理
asyncProcess()
setSubscribe()


/**
 * 非同期処理によるWorldやVersionの読み込みをはじめとした起動時処理
 */
async function asyncProcess() {
  await initWindow()
  afterWindow()
  
  await router.push('/')
  progressStore.initProgress()
}

/**
 * Piniaの特定の変数に対する監視を入れたい場合に処理を記述
 * TODO: 【緊急】別の方法も含めて、Worldに変更が入った場合のみinvokeSetWorld()を呼び出す方法を検討
 */
function setSubscribe() {
  const mainStore = useMainStore()
  const { worldList } = storeToRefs(mainStore)

  watch(worldList, (newVal, oldVal) => {
    console.log('########### TEST ##############')

    // NewWorldでないときにWorldの設定をファイルに保存する
    if (!mainStore.newWorlds.includes(mainStore.selectedWorldID)) {
      window.API.invokeSetWorld(toRaw(mainStore.world())).then(v => {
        checkError(
          v.value,
          undefined,
          'ワールドの設定を保存できませんでした'
        )
      })
    }

    // w => mainStore.worldList[oldVal.id] = w
  }, { immediate: true, deep: true })
}
</script>

<template>
  <div class="absolute-center">
    <progress-page/>
  </div>
</template>