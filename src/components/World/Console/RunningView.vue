<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';

const consoleStore = useConsoleStore()

// 自動スクロール
function autoScroll() {
  let container = document.getElementById('scroll');
  container?.scrollIntoView(false);
  if (container != null) {
    container.scrollTop = container.scrollHeight;
  }
}
// コンソール表示
window.API.onAddConsole(() => {
  autoScroll();
});
</script>

<template>
  <q-virtual-scroll
    v-if="consoleStore.status === 'Running'"
    id="scroll"
    :items="consoleStore.console"
    v-slot="{ item }"
    class="q-pa-md fit"
    style="flex: 1 1 0;"
  >
    <p style="word-break:break-all;">{{ item }}</p>
  </q-virtual-scroll>
</template>

<style lang="scss" scoped>
p {
  font-size: 16pt;
  line-height: 1.2;
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
}
</style>
