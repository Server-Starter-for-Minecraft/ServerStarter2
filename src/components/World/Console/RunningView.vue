<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';

const consoleStore = useConsoleStore()
</script>

<template>
  <div v-if="consoleStore.status === 'Running'">
    <q-virtual-scroll
      id="scroll"
      :items="useConsoleStore().console"
      v-slot="{ item }"
      class="q-pa-md fit"
      style="width: 100vw; height: 100%; flex: 1 1 0;"
    >
      <p style="word-break:break-all;">{{ item }}</p>
    </q-virtual-scroll>
  </div>
</template>