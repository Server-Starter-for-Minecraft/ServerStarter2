<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { checkError } from 'src/components/Error/Error';
import { tError } from 'src/i18n/utils/tFunc';
import RunningBtn from '../HOME/RunningBtn.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

async function showLog() {
  const logs = await window.API.invokeFetchLatestWorldLog(mainStore.selectedWorldID)
  checkError(
    logs,
    l => consoleStore.setAllConsole(mainStore.selectedWorldID, l, 'CheckLog'),
    e => tError(e)
  )
}
</script>

<template>
  <div v-if="consoleStore.status(mainStore.selectedWorldID) === 'Stop'" class="justify-center column fit">
    <running-btn :text-font-size="1.5" class="btn" style="width: fit-content; margin: 0 auto;" />
    <ss-btn
      label="直前のサーバログを表示"
      width="14rem"
      @click="showLog"
      style="font-size: 1rem; margin: 1rem auto;"
    />
  </div>
</template>

<style scoped lang="scss">
.btn {
  padding: 6px 64px;
  margin: auto 16px;
}
</style>