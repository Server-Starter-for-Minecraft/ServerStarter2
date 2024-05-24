<script setup lang="ts">
import ProgressPage from 'src/pages/ProgressPage.vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();
</script>

<template>
  <div
    v-if="consoleStore.status(mainStore.selectedWorldID) === 'Ready'"
    class="vertical-scroll"
    style="flex: 1 1 0"
  >
    <progress-page />
  </div>
</template>
