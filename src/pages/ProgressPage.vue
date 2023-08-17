<script setup lang="ts">
import { useQuasar } from 'quasar';
import { EulaDialogProp } from 'src/components/Progress/iEulaDialog';
import { useMainStore } from 'src/stores/MainStore';
import { useProgressStore } from 'src/stores/ProgressStore';
import ProgressView from 'src/components/Progress/ProgressView.vue';
import EulaDialog from 'src/components/Progress/EulaDialog.vue';

const $q = useQuasar()
const mainStore = useMainStore()
const progressStore = useProgressStore();

// Eulaの同意処理
window.API.handleAgreeEula(async (_: Electron.IpcRendererEvent, worldID, url) => {
  const promise = new Promise<boolean>(
    (resolve) => { progressStore.back2frontHandler(worldID, resolve) }
  );

  $q.dialog({
    component: EulaDialog,
    componentProps: {
      eulaURL: url
    } as EulaDialogProp
  }).onOk(() => {
    progressStore.getProgress(worldID).selecter?.(true)
  }).onCancel(() => {
    progressStore.getProgress(worldID).selecter?.(false)
  })

  return await promise;
});

window.API.onProgress((_event, worldID, progress) => {
  progressStore.setProgress(worldID, progress)
});
</script>

<template>
  <div class="justify-center column items-center fit">
    <div style="width: 30rem;">
      <h1 style="font-weight: bold;">{{ progressStore.getProgress(mainStore.world.id).title }}</h1>
      <ProgressView :progress="progressStore.getProgress(mainStore.world.id)?.progress" />
    </div>
  </div>
</template>