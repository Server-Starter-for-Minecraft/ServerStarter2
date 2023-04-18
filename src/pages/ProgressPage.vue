<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useProgressStore } from '../stores/ProgressStore';
let agree: Ref<((value: boolean) => void) | null> = ref(null);

const progressStore = useProgressStore();

// Eulaの同意処理
window.API.handleAgreeEula(async (_: Electron.IpcRendererEvent) => {
  const promise = new Promise<boolean>((resolve) => {
    agree.value = (value: boolean) => {
      agree.value = null;
      resolve(value);
    };
  });
  return await promise;
});

window.API.onUpdateStatus((_event, message, ratio) => {
  progressStore.message = message;
  progressStore.progressRatio = ratio;
});
</script>

<template>
  <div class="absolute-center circle">
    <q-circular-progress
      indeterminate
      size="50px"
      :thickness="0.22"
      rounded
      color="primary"
      track-color="grey-3"
      class="q-ma-md"
    />

    <p class="message">{{ progressStore.message }}</p>
    <div v-if="progressStore.progressRatio">
      <q-linear-progress
        :value="progressStore.progressRatio / 100"
        rounded
        color="$primary"
        class="q-pa-md"
        style="max-height: 1pt"
      />
    </div>
    <q-btn v-show="agree" @click="agree?.(true)">AGREE EULA!!</q-btn>
    <q-btn v-show="agree" @click="agree?.(false)">DISAGREE EULA!!</q-btn>
  </div>
</template>

<style scoped lang="scss">
.circle {
  text-align: center;
}

.message {
  font-size: 20pt;
}
</style>
