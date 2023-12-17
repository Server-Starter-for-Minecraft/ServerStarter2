<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';
import RunningBtn from '../HOME/RunningBtn.vue';

const consoleStore = useConsoleStore()
</script>

<template>
  <div v-if="consoleStore.status() === 'Stop'" class="justify-center row fit">
    <running-btn :text-font-size="1.5" class="btn" />
  </div>
</template>

<style scoped lang="scss">
.btn {
  padding: 6px 64px;
  margin: auto 16px;
}
</style>