<script setup lang="ts">
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';

const consoleStore = useConsoleStore()
</script>

<template>
  <div
    v-if="consoleStore.status() === 'Stop'"
    class="justify-center row fit"
  >
    <q-btn
      label="サーバーを起動"
      size="1rem"
      icon="play_arrow"
      color="primary"
      style="margin: auto 0;"
      @click="runServer()"
    />
  </div>
</template>