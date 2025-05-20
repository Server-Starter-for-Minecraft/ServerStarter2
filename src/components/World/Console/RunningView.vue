<script setup lang="ts">
import { Ref, ref } from 'vue';
import { QVirtualScroll } from 'quasar';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();
const virtualListRef: Ref<null | QVirtualScroll> = ref(null);

/** コンソールのカスタム表示に将来的に対応 */
const defaultStyles = {
  'font-size': '14pt',
  'font-family': "'BizinGothic', Consolas, 'Courier New', Meiryo, monospace",
  // 行間・行内改行の別なく占有される文字高さ
  'line-height': 1.2,
  // 行間のマージン
  'margin-bottom': '2pt',
  // 文字色（空文字列はシステム設定に追従）
  color: '',
  opacity: 0.85,
};

/**
 * コンソールの一番下に自動でスクロールする
 */
function scroll2End() {
  virtualListRef.value?.scrollTo(
    consoleStore.console(mainStore.selectedWorldID).length,
    'start-force'
  );
}
setTimeout(scroll2End, 0);

// コンソール表示
consoleStore.$subscribe((mutation, state) => {
  // TODO: センスのある記法求む
  setTimeout(scroll2End, 0);
});
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
    v-if="
      ['Running', 'CheckLog'].includes(
        consoleStore.status(mainStore.selectedWorldID)
      )
    "
    ref="virtualListRef"
    :items="consoleStore.console(mainStore.selectedWorldID)"
    v-slot="{ item }"
    class="q-pa-md fit"
    style="flex: 1 1 0"
  >
    <p :class="item.isError ? 'text-negative' : ''" :style="defaultStyles">
      {{ item.chunk }}
    </p>
  </q-virtual-scroll>
</template>

<style lang="scss" scoped>
p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
}
</style>
