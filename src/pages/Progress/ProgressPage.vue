<script setup lang="ts">
import { getStore, setStatus, setProgress } from '../../stores/ProgressStore';
const store = getStore();

// Eulaの同意処理
// TODO:Eula確認画面の表示 (現状問答無用でtrueを返すようになっている)
window.API.handleEula(async (_: Electron.IpcRendererEvent) => {
  return true;
});

window.ProgressAPI.onUpdateStatus((_event, value) => {
  setStatus(value[0]);
  setProgress(value[1]);
});
</script>

<template>
  <q-circular-progress
    indeterminate
    size="50px"
    :thickness="0.22"
    rounded
    color="primary"
    track-color="grey-3"
    class="q-ma-md"
  />

  <h1>{{ store.message }}</h1>

  <div v-if="store.progressRatio != -1">
    <q-linear-progress
      :value="store.progressRatio / 100"
      rounded
      size="20px"
      color="$primary"
      class="q-pa-md"
    />
  </div>
</template>
