<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { QScrollArea, useQuasar } from 'quasar';
import { ConsoleData, MatchedConsoleData } from 'src/schema/console';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { ansiStyleToCss } from './ansi';
import { ConsolePiece, overlayMatches } from './consoleLine';
import { consoleScrollMemory } from './consoleScroll';
import ConsoleSearch from './ConsoleSearch.vue';

const $q = useQuasar();
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
 * 1行分のデータを、文字色などの装飾と検索結果を反映した表示用の断片に分割する
 */
function linePieces(item: ConsoleData | MatchedConsoleData): ConsolePiece[] {
  if ('matches' in item) {
    const text = item.matches.map((m) => m.text).join('');
    return overlayMatches(item.segments ?? [{ text, style: {} }], item.matches);
  }
  const segments = item.segments ?? [{ text: item.chunk, style: {} }];
  return segments.map((s) => ({ ...s, isMatch: false }));
}

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
 * 表示中のワールドのスクロール状態を復元しているか
 *
 * 表示するワールドの切り替え中は、内容の入れ替えに伴うスクロールイベントを
 * ユーザーの操作として記録しないようにする
 */
let restoring = false;

/**
 * 表示中のワールドについて記憶しているスクロール位置を復元する
 */
function restoreScroll() {
  restoring = true;
  nextTick(() => {
    const target = consoleScrollMemory.restoreTarget(mainStore.selectedWorldID);
    if (target === 'bottom') scroll2End();
    else scrollAreaRef.value?.setScrollPosition('vertical', target);
    // スクロール位置の反映（scrollイベント）が終わってから記録を再開する
    requestAnimationFrame(() => (restoring = false));
  });
}

/**
 * スクロールされた際に、表示中のワールドのスクロール状態を記録する
 *
 * QScrollAreaのscrollイベントの値は内容の高さの更新が遅れる場合があるため、実際の要素の値を記録する
 */
function onScroll() {
  const target = scrollAreaRef.value?.getScrollTarget();
  if (restoring || !target) return;
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
    if (restoring) return;
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
        <span
          v-for="(piece, pieceIndex) in linePieces(item)"
          :key="pieceIndex"
          :class="piece.isMatch ? 'highlight-match' : ''"
          :style="ansiStyleToCss(piece.style, $q.dark.isActive)"
          >{{ piece.text }}</span
        >
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
