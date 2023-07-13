<script setup lang="ts">
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()
</script>

<template>
  <div
    v-if="consoleStore.status() === 'Stop'"
    class="justify-center row fit"
  >
    <q-btn
      :label="$t('console.boot')"
      size="1rem"
      icon="play_arrow"
      color="primary"
      :disable="mainStore.errorWorlds.has(mainStore.world.id)"
      style="margin: auto 0;"
      @click="runServer()"
    />
  </div>
</template>