<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import ConsoleSearch from './ConsoleSearch.vue';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const consoleSearchRef = ref<InstanceType<typeof ConsoleSearch> | null>(null);

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
 * コンソールの一番下に自動でスクロールする
 */
function scroll2End() {
  const lastIdx = consoleLines.value.length - 1;
  scrollToMatch(lastIdx);
}

/** コンソールの内容が更新されたら，一番下にスクロールする */
consoleStore.$subscribe((mutation, state) => {
  nextTick(() => scroll2End());
});

onMounted(() => {
  // 最終行を最初に表示する
  scroll2End();

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

    <q-scroll-area class="q-px-md fit">
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
        <template v-if="'matches' in item">
          <template v-for="(part, partIndex) in item.matches" :key="partIndex">
            <span v-if="part.isMatch" class="highlight-match">
              {{ part.text }}
            </span>
            <template v-else>{{ part.text }}</template>
          </template>
        </template>
        <template v-else>{{ item.chunk }}</template>
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
