<script setup lang="ts">
import { onMounted, onUnmounted, Ref, ref } from 'vue';
import { QVirtualScroll } from 'quasar';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import ConsoleSearch from './ConsoleSearch.vue';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();
const virtualListRef: Ref<null | QVirtualScroll> = ref(null);
const isSearchVisible = ref(false);
const searchQuery = ref('');
const searchResults = ref<number[]>([]);
const currentMatchIndex = ref(-1);

/** コンソールのカスタム表示に将来的に対応 */
const defaultStyles = {
  'font-size': '14pt',
  'font-family':
    "'Pending Mono HWNF', Consolas, 'Courier New', Meiryo, monospace",
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

/**
 * 検索機能を表示する
 */
function showSearch() {
  isSearchVisible.value = true;
}

/**
 * 検索機能を閉じる
 */
function closeSearch() {
  isSearchVisible.value = false;
  searchQuery.value = '';
  searchResults.value = [];
}

/**
 * 指定されたインデックスの項目にスクロールする
 */
function scrollToMatch(index: number) {
  virtualListRef.value?.scrollTo(index, 'start');
  currentMatchIndex.value = searchResults.value.indexOf(index);
}

/**
 * 検索結果を更新する
 */
function updateSearchResults(query: string, results: number[]) {
  searchQuery.value = query;
  searchResults.value = results;
  currentMatchIndex.value = results.length > 0 ? 0 : -1;
}

/**
 * テキストを分割して検索クエリに一致する部分を特定する
 * @returns 分割されたテキストの配列（一致部分にはisMatchフラグが付く）
 */
function splitTextByQuery(text: string, query: string) {
  if (!query || !text) return [{ text, isMatch: false }];
  const regex = new RegExp(query, 'gi');

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add non-matching text before this match
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isMatch: false,
      });
    }

    // Add the matching text
    parts.push({
      text: match[0],
      isMatch: true,
    });

    lastIndex = match.index + match[0].length;

    // Avoid infinite loops with zero-width matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isMatch: false,
    });
  }

  return parts;
}

/**
 * キーボードショートカットのハンドラ
 */
function handleKeyDown(event: KeyboardEvent) {
  // Ctrl+F で検索を表示
  if (event.key === 'f' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    showSearch();
  }
}

// キーボードイベントのリスナーを設定
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="console-container">
    <!-- 検索ボタン -->
    <q-btn
      v-if="!isSearchVisible"
      class="search-button"
      round
      flat
      dense
      icon="search"
      @click="showSearch"
    />

    <!-- 検索コンポーネント -->
    <ConsoleSearch
      :is-visible="isSearchVisible"
      :console-items="consoleStore.console(mainStore.selectedWorldID)"
      @close="closeSearch"
      @scroll-to-match="scrollToMatch"
      @update-search-results="updateSearchResults"
    />

    <q-virtual-scroll
      v-if="
        ['Running', 'CheckLog'].includes(
          consoleStore.status(mainStore.selectedWorldID)
        )
      "
      ref="virtualListRef"
      :items="consoleStore.console(mainStore.selectedWorldID)"
      v-slot="{ item, index }"
      class="q-pa-md fit"
      style="flex: 1 1 0"
    >
      <p
        :class="[
          item.isError ? 'text-negative' : '',
          searchResults.includes(index) &&
          searchResults[currentMatchIndex] === index
            ? 'current-match'
            : '',
        ]"
        :style="defaultStyles"
      >
        <template v-if="!searchQuery">
          {{ item.chunk }}
        </template>
        <template v-else>
          <template
            v-for="(part, partIndex) in splitTextByQuery(
              item.chunk,
              searchQuery
            )"
            :key="partIndex"
          >
            <span v-if="part.isMatch" class="highlight-match">
              {{ part.text }}
            </span>
            <template v-else>{{ part.text }}</template>
          </template>
        </template>
      </p>
    </q-virtual-scroll>
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

.search-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  background-color: rgba(255, 255, 255, 0.7);
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
