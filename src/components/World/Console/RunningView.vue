<script setup lang="ts">
import { Ref, ref } from 'vue';
import { QVirtualScroll } from 'quasar';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()
const virtualListRef: Ref<null | QVirtualScroll> = ref(null)

/**
 * コンソールの一番下に自動でスクロールする
 */
function scroll2End() {
  virtualListRef.value?.scrollTo(consoleStore.console(mainStore.selectedWorldID).length, 'start-force')
}
setTimeout(scroll2End, 0)

// コンソール表示
consoleStore.$subscribe((mutation, state) => {
  // TODO: センスのある記法求む
  setTimeout(scroll2End, 0)
})
</script>

<template>
  <!-- TODO: 一番下でないときにボタンを表示 -->
  <!-- <q-btn
    class="q-ml-sm"
    label="Go"
    no-caps
    color="primary"
    @click="scroll2End"
  /> -->

  <q-virtual-scroll
    v-if="['Running', 'CheckLog'].includes(consoleStore.status(mainStore.selectedWorldID))"
    ref="virtualListRef"
    :items="consoleStore.console(mainStore.selectedWorldID)"
    v-slot="{ item }"
    class="q-pa-md fit"
    style="flex: 1 1 0;"
  >
    <p :class="item.isError ? 'text-negative' : ''" style="word-break: break-all; user-select: text;">
      {{ item.chunk }}
    </p>
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
