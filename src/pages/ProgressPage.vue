<script setup lang="ts">
import { useProgressStore } from '../stores/ProgressStore';

const progressStore = useProgressStore();

// Eulaの同意処理
window.API.handleAgreeEula(async (_: Electron.IpcRendererEvent, worldID) => {
  const promise = new Promise<boolean>(
    (resolve) => { progressStore.back2frontHandler(resolve, worldID) }
  );
  return await promise;
});

window.API.onProgress((_event, worldID, progress) => {
  // TODO: onProgressに対応
  // progressStore.setProgress(progress. message, current=current, total=total, worldID=worldID)
});
</script>

<template>
  <div class="justify-center column items-center fit">
    <q-circular-progress
      indeterminate
      size="50px"
      :thickness="0.22"
      rounded
      color="primary"
      track-color="grey-3"
      class="q-ma-md"
      style="margin: auto 0;"
    />

    <p class="message">{{ progressStore.message }}</p>
    <div v-if="progressStore.ratio !== void 0">
      <q-linear-progress
        :value="(progressStore.ratio as number) / 100"
        rounded
        color="$primary"
        class="q-pa-md"
        style="max-height: 1pt"
      />
    </div>

    <q-btn
      v-show="progressStore.userSelecter"
      @click="progressStore.userSelecter?.(true)"
      label="AGREE EULA!!"
    />
    <q-btn
      v-show="progressStore.userSelecter"
      @click="progressStore.userSelecter?.(false)"
      label="DISAGREE EULA!!"
    />
  </div>
</template>

<style scoped lang="scss">
.message {
  font-size: 20pt;
}
</style>
