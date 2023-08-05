<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router'
import { initWindow, afterWindow } from 'app/src/init';
import { useSystemStore } from 'src/stores/SystemStore';
import { useProgressStore } from 'src/stores/ProgressStore';
import ProgressPage from './ProgressPage.vue';
import WelcomeDialog from 'src/components/App/WelcomeDialog.vue'

const progressStore = useProgressStore()
progressStore.setProgress('ServerStarter2を起動中')

const $q = useQuasar();
const router = useRouter()
const sysStore = useSystemStore()

// 起動時処理
asyncProcess()

// 利用規約へ同意
if (!sysStore.systemSettings.user.eula) {
  $q.dialog({
    component: WelcomeDialog
  }).onOk(() => {
    sysStore.systemSettings.user.eula = true
    switchPage()    
  })
}
else {
  switchPage()
}


/**
 * 非同期処理によるWorldやVersionの読み込みをはじめとした起動時処理
 */
async function asyncProcess() {
  await initWindow()
  afterWindow()
}

/**
 * ページをホーム画面へ遷移し、プログレスを終了する
 */
async function switchPage() {
  await router.replace('/')
  progressStore.initProgress()
}
</script>

<template>
  <div class="absolute-center">
    <progress-page/>
  </div>
</template>