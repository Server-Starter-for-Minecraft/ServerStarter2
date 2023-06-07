<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';
import ProgressPage from 'src/pages/ProgressPage.vue';

const consoleStore = useConsoleStore()
</script>

<template>
  <div v-if="consoleStore.status() === 'Ready'" class="fit">
    <progress-page/>
  </div>
</template>