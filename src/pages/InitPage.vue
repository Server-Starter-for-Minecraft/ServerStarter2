<script setup lang="ts">
import { useRouter } from 'vue-router'
import { initWindow, afterWindow } from 'app/src/init';
import { useProgressStore } from 'src/stores/ProgressStore';
import ProgressPage from './ProgressPage.vue';

const progressStore = useProgressStore()
progressStore.setProgress('ServerStarter2を起動中')

const router = useRouter()

// 起動時処理
async function asyncProcess() {
  console.log('process is started')
  await initWindow()
  console.log('init process is end')
  afterWindow()
  console.log('after process is end')
  
  await router.push('/')
  progressStore.initProgress()
}
asyncProcess()
</script>

<template>
  <div class="absolute-center">
    <progress-page/>
  </div>
</template>