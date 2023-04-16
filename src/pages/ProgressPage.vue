<script setup lang="ts">
import { Ref, ref } from 'vue';
import { progressStore } from '../stores/ProgressStore';
let agree: Ref<((value: boolean) => void) | null> = ref(null);

// Eulaの同意処理
// TODO:Eula確認画面の表示 (現状問答無用でtrueを返すようになっている)
window.API.handleEula(async (_: Electron.IpcRendererEvent) => {
  const promise = new Promise<boolean>((resolve) => {
    agree.value = (value: boolean) => {
      agree.value = null;
      resolve(value);
    };
  });
  return await promise;
});

window.ProgressAPI.onUpdateStatus((_event, value) => {
  progressStore().message = value[0];
  progressStore().progressRatio = value[1];
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

  <h1>{{ progressStore().message }}</h1>

  <div v-if="progressStore().progressRatio != -1">
    <q-linear-progress
      :value="progressStore().progressRatio / 100"
      rounded
      size="20px"
      color="$primary"
      class="q-pa-md"
    />
  </div>
  <q-btn v-if="agree" @click="agree?.(true)">AGREE EULA!!</q-btn>
  <q-btn v-if="agree" @click="agree?.(false)">DISAGREE EULA!!</q-btn>
</template>
