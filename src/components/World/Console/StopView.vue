<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import RunningBtn from '../HOME/RunningBtn.vue';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()
</script>

<template>
  <div
    v-if="consoleStore.status(mainStore.selectedWorldID) === 'Stop'"
    class="justify-center row fit"
  >
    <RunningBtn :text-font-size="1.5" class="btn" />
  </div>
</template>

<style scoped lang="scss">
.btn {
  padding: 6px 64px;
  margin: auto 16px;
}
</style>