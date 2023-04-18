<script setup lang="ts">
import { useConsoleStore } from 'app/src/stores/ConsoleStore';

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
  <div>
    <q-virtual-scroll
      :items="useConsoleStore().console"
      v-slot="{ item }"
      class="q-py-md console"
      style="width: 100vw"
    >
      <span style="width: max-content">{{ item }}</span><br/>
      <!-- <p
        v-for="item in useConsoleStore().console"
        :key="item"
        style="width: max-content"
      >
        {{ item }}
      </p> -->
    </q-virtual-scroll>
    <!-- <div id="scroll" class="q-pl-sm q-pt-sm console">
      <br />
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
span {
  font-size: 16pt;
  line-height: 1.2;
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
}

.console {
  white-space: pre;
  overflow: scroll;
}
</style>
