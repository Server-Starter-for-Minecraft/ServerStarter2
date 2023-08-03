<script setup lang="ts">
import { getCssVar } from 'quasar';
import { assets } from 'src/assets/assets'
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()
</script>

<template>
  <div
    v-if="consoleStore.status() === 'Stop'"
    class="justify-center row fit"
  >
    <ss-btn
      free-width
      color="primary"
      :disable="mainStore.errorWorlds.has(mainStore.world.id)"
      @click="runServer"
      class="btn"
    >
      <q-avatar square class="q-mr-md q-my-sm" size="4rem">
        <q-icon :name="assets.svg.systemLogo_filled(getCssVar('primary')?.replace('#', '%23'))" />
      </q-avatar>
      <span style="font-size: 1.5rem;">{{ $t('console.boot', { name: mainStore.world.name }) }}</span>
    </ss-btn>
  </div>
</template>

<style scoped lang="scss">
.btn {
  padding: 6px 64px;
  margin: auto 0;
}
</style>