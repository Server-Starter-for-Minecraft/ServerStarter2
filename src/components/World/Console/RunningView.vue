<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { QScrollArea } from 'quasar';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import ConsoleLineView from './ConsoleLineView.vue';
import { consoleScrollMemory } from './consoleScroll';
import ConsoleSearch from './ConsoleSearch.vue';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const consoleSearchRef = ref<InstanceType<typeof ConsoleSearch> | null>(null);
const scrollAreaRef = ref<QScrollArea | null>(null);

/** コンソールのカスタム表示に将来的に対応 */
const defaultStyles = {
  'font-size': '14pt',
  'font-family':
    "'Pending Mono HWNF', Consolas, 'Courier New', Meiryo, monospace",
  // 行間・行内改行の別なく占有される文字高さ
  'line-height': 1.2,
  // 行間のマージン
  'margin-bottom': '5pt',
  // 文字色（空文字列はシステム設定に追従）
  color: '',
  opacity: 0.85,
};

const consoleLines = computed(() => {
  if (!consoleSearchRef.value) {
    return consoleStore.console(mainStore.selectedWorldID);
  }
  return consoleSearchRef.value.getMatchedLines(
    consoleStore.console(mainStore.selectedWorldID)
  );
});

const currentFocusLineIdx = computed(() => {
  if (!consoleSearchRef.value) {
    return -1;
  }
  return consoleSearchRef.value.currentFocusLineIdx;
});

/**
 * 指定されたインデックスの項目にスクロールする
 */
function scrollToMatch(index: number) {
  const anchorId = `console-line-${index}`;
  const element = document.getElementById(anchorId);

  element?.scrollIntoView({
    behavior: 'instant',
    block: 'center',
  });
}

/**
 * コンソールの一番下にスクロールする
 *
 * QScrollAreaが保持する内容の高さは描画後に非同期で更新されるため、
 * 出力の追加直後でも正しく最下部へ移動できるよう、実際の要素の高さを用いる
 */
function scroll2End() {
  const target = scrollAreaRef.value?.getScrollTarget();
  if (!target) return;
  target.scrollTop = target.scrollHeight;
}

/**
 * 表示中のワールドについて記憶しているスクロール位置を復元する
 */
function restoreScroll() {
  // 表示する内容が切り替わった後（描画後）に復元する
  nextTick(() => {
    const target = consoleScrollMemory.restoreTarget(mainStore.selectedWorldID);
    if (target === 'bottom') scroll2End();
    else scrollAreaRef.value?.setScrollPosition('vertical', target);
  });
}

/**
 * スクロールされた際に、表示中のワールドのスクロール状態を記録する
 *
 * QScrollAreaのscrollイベントの値は内容の高さの更新が遅れる場合があるため、実際の要素の値を記録する。
 * （scrollイベントは描画後に遅れて届くため、表示するワールドの切り替えに伴うイベントでも、
 * 切り替え後のワールドの表示状態が記録される）
 */
function onScroll() {
  const target = scrollAreaRef.value?.getScrollTarget();
  if (!target) return;
  consoleScrollMemory.record(mainStore.selectedWorldID, {
    position: target.scrollTop,
    contentSize: target.scrollHeight,
    containerSize: target.clientHeight,
  });
}

// 表示するワールドを切り替えた際は，そのワールドのスクロール状態を復元する
watch(
  () => mainStore.selectedWorldID,
  () => restoreScroll()
);

// 表示中のワールドに出力が追加された際は，最下部を表示していた場合のみ追従する
// （プログレスバーのように最終行が書き換えられた場合も追従する）
watch(
  () => {
    const lines = consoleStore.console(mainStore.selectedWorldID);
    return [lines.length, lines[lines.length - 1]?.chunk];
  },
  () => {
    if (consoleScrollMemory.shouldFollowOutput(mainStore.selectedWorldID)) {
      nextTick(() => scroll2End());
    }
  }
);

onMounted(() => {
  // 前回表示していた位置（初めての場合は最終行）を表示する
  restoreScroll();

  // Setup keyboard event listeners
  if (!consoleSearchRef.value) return;
  window.addEventListener('keydown', consoleSearchRef.value?.handleKeyDown);
});

onUnmounted(() => {
  if (!consoleSearchRef.value) return;
  window.removeEventListener('keydown', consoleSearchRef.value?.handleKeyDown);
});
</script>

<template>
  <div class="console-container">
    <!-- 検索コンポーネント -->
    <ConsoleSearch ref="consoleSearchRef" @scroll-to-match="scrollToMatch" />

    <q-scroll-area ref="scrollAreaRef" class="q-px-md fit" @scroll="onScroll">
      <p
        v-for="(item, index) in consoleLines"
        :key="index"
        :id="`console-line-${index}`"
        :class="[
          item.isError ? 'text-negative' : '',
          currentFocusLineIdx === index ? 'current-match' : '',
        ]"
        :style="defaultStyles"
      >
        <ConsoleLineView :item="item" />
      </p>
    </q-scroll-area>
  </div>
</template>

<style lang="scss" scoped>
.console-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
}

:deep(.highlight-match) {
  background-color: rgba(255, 255, 0, 0.5);
  border-radius: 2px;
  padding: 0 1px;
}

.current-match {
  background-color: rgba(255, 165, 0, 0.2);

  :deep(.highlight-match) {
    background-color: rgba(255, 165, 0, 0.6);
    font-weight: bold;
  }
}
</style>
