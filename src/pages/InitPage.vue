<script setup lang="ts">
import { initWindow, afterWindow } from 'app/src/init';
import { useRouter } from 'vue-router'
import ProgressPage from './ProgressPage.vue';
import { useProgressStore } from 'src/stores/ProgressStore';

const progressStore = useProgressStore()
progressStore.setProgress('ServerStarter2を起動中')


const router = useRouter()

async function asyncProcess() {
  await initWindow()
  afterWindow()
  
  await router.push('/')
  
  progressStore.initProgress()
}
asyncProcess()
</script>

<template>
  <progress-page/>
</template>