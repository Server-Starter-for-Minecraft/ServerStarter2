<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import {
  ConsoleData,
  MatchedConsoleData,
  MatchResult,
} from 'src/schema/console';
import { $T } from 'src/i18n/utils/tFunc';
import SsInput from 'src/components/util/base/ssInput.vue';

// TODO: 配色・UIの調整

/** 検索結果として表示する最大件数 */
const LIMIT_SEARCH_RESULTS = 10000;

const emit = defineEmits<{
  (e: 'scrollToMatch', index: number): void;
}>();

/** 最終行のインデックス */
const lastLineIdx = ref<number>(-1);
/** 検索結果のうち，マッチしたもののLineIdxを保持 */
const matchedIdx2LineNum = ref<number[]>([]);
/** `focusLineIdx`がマッチしたもののうち何番目か */
const currentMatchIndex = ref<number>(-1);
/** 現在選択中の行 */
const currentFocusLineIdx = computed(() => {
  if (
    currentMatchIndex.value < 0 ||
    currentMatchIndex.value >= matchedIdx2LineNum.value.length
  ) {
    return -1;
  } else {
    return matchedIdx2LineNum.value[currentMatchIndex.value];
  }
});

const searchInput = ref('');
const isSearchVisible = ref(false);

// Computed property to get the current match count display
const matchCountText = () => {
  if (matchedIdx2LineNum.value.length === 0)
    return $T('console.search.noMatches');
  if (matchedIdx2LineNum.value.length > LIMIT_SEARCH_RESULTS) {
    return $T('console.search.matchCount', {
      current: '?',
      total: `${LIMIT_SEARCH_RESULTS}+`,
    });
  }
  return $T('console.search.matchCount', {
    current: currentMatchIndex.value + 1,
    total: matchedIdx2LineNum.value.length,
  });
};

/**
 * テキストを分割して検索クエリに一致する部分を特定する
 * @returns 分割されたテキストの配列（一致部分にはisMatchフラグが付く）
 */
function isMatchQuery(text: string): MatchResult[] {
  const query = searchInput.value.trim();
  if (query === '' || !text) return [{ text, isMatch: false }];
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

/** 呼び出しコンポーネントで検索対象とする文字列群を与えると，検索結果を付与した文字列群を返す */
function getMatchedLines(lines: ConsoleData[]): MatchedConsoleData[] {
  matchedIdx2LineNum.value = [];
  lastLineIdx.value = lines.length - 1;
  const res = lines.map((item, idx) => {
    const res = isMatchQuery(item.chunk);
    if (res.some((part) => part.isMatch)) matchedIdx2LineNum.value.push(idx);
    return { isError: item.isError, matches: res };
  });

  if (matchedIdx2LineNum.value.length === 0) {
    currentMatchIndex.value = -1;
  } else {
    currentMatchIndex.value = 0;
  }

  return res;
}

// Navigate to the next match
function nextMatch() {
  if (currentMatchIndex.value === -1) return;
  if (currentMatchIndex.value === matchedIdx2LineNum.value.length - 1) {
    currentMatchIndex.value = 0;
  } else {
    currentMatchIndex.value = currentMatchIndex.value + 1;
  }
  navigateToCurrentFocusLine(currentFocusLineIdx.value);
}

// Navigate to the previous match
function prevMatch() {
  if (currentMatchIndex.value === -1) return;
  if (currentMatchIndex.value === 0) {
    currentMatchIndex.value = matchedIdx2LineNum.value.length - 1;
  } else {
    currentMatchIndex.value = currentMatchIndex.value - 1;
  }
  navigateToCurrentFocusLine(currentFocusLineIdx.value);
}

// Emit event to scroll to the current match
function navigateToCurrentFocusLine(lineIdx: number) {
  nextTick(() => {
    emit('scrollToMatch', lineIdx);
  });
}

// Close the search box
function closeSearch() {
  searchInput.value = '';
  currentMatchIndex.value = -1;
  isSearchVisible.value = false;
  // 検索ボックスを閉じる際に最終行へ移動する
  navigateToCurrentFocusLine(lastLineIdx.value);
  lastLineIdx.value = -1;
}

// Handle keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  // Ctrl+F で検索を表示
  if (event.key === 'f' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    isSearchVisible.value = true;
  }

  // 検索ボックス内での操作
  if (event.key === 'Escape') {
    closeSearch();
    event.preventDefault();
  } else if (event.key === 'Enter') {
    if (event.shiftKey) {
      prevMatch();
    } else {
      nextMatch();
    }
    event.preventDefault();
  } else if (event.key === 'F3' && event.ctrlKey) {
    prevMatch();
    event.preventDefault();
  }
}

// 公開メソッド
defineExpose({ getMatchedLines, handleKeyDown, currentFocusLineIdx });
</script>

<template>
  <!-- 検索ボタン -->
  <q-btn
    v-if="!isSearchVisible"
    class="search-button"
    round
    flat
    dense
    icon="search"
    @click="isSearchVisible = true"
  />

  <!-- 検索ボックス -->
  <div v-else class="console-search">
    <q-card flat class="search-container">
      <SsInput
        v-model="searchInput"
        @update:model-value="navigateToCurrentFocusLine(currentFocusLineIdx)"
        dense
        autofocus
        class="search-input"
        :placeholder="$T('console.search.placeholder')"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </SsInput>

      <div class="search-controls">
        <span class="gt-sm match-count">{{ matchCountText() }}</span>
        <q-btn
          flat
          round
          dense
          icon="keyboard_arrow_up"
          :disable="matchedIdx2LineNum.length === 0"
          @click="prevMatch"
        />
        <q-btn
          flat
          round
          dense
          icon="keyboard_arrow_down"
          :disable="matchedIdx2LineNum.length === 0"
          @click="nextMatch"
        />
        <q-btn flat round dense icon="close" @click="closeSearch" />
      </div>
    </q-card>
  </div>
</template>

<style lang="scss" scoped>
.console-search {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.search-container {
  display: flex;
  align-items: center;
  padding: 4px;
}

.search-input {
  width: 250px;
}

.search-controls {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.match-count {
  width: 5rem;
}
</style>
