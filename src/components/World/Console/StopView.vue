<script setup lang="ts">
import { $T, tError } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import RunningBtn from '../HOME/RunningBtn.vue';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();

async function showLog() {
  const logs = await window.API.invokeFetchLatestWorldLog(
    mainStore.selectedWorldID
  );
  checkError(
    logs,
    (l) => consoleStore.setAllConsole(mainStore.selectedWorldID, l, 'CheckLog'),
    (e) => tError(e)
  );
}
</script>

<template>
  <div class="column justify-center fit" style="flex: 1 1 0">
    <RunningBtn :text-font-size="1.5" class="btn" />
    <SsBtn
      :label="$T('console.showLog')"
      width="16rem"
      @click="showLog"
      style="font-size: 1rem; margin: 1rem auto"
    />
  </div>
</template>

<style scoped lang="scss">
.btn {
  width: fit-content;
  max-width: 90%;
  margin: 0 auto;
}
</style>
