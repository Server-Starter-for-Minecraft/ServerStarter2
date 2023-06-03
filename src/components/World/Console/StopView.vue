<script setup lang="ts">
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';

const consoleStore = useConsoleStore()
</script>

<template>
  <div v-if="consoleStore.status === 'Stop'">
    <q-btn label="サーバーを起動" @click="runServer()" color="primary"/>
  </div>
</template>