<script setup lang="ts">
import { Ref, ref } from 'vue';
import { QVirtualScroll } from 'quasar';
import { useConsoleStore } from 'src/stores/ConsoleStore';

const consoleStore = useConsoleStore()
// TODO: これをPinia側で定義してうまく動くかどうかを確認
const virtualListRef: Ref<null | QVirtualScroll> = ref(null)

/**
 * コンソールの一番下に自動でスクロールする
 */
function scroll2End() {
  virtualListRef.value?.scrollTo(consoleStore.console().length, 'start-force')
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
    v-if="consoleStore.status() === 'Running'"
    ref="virtualListRef"
    :items="consoleStore.console()"
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
