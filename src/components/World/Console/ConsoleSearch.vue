<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ConsoleData, MatchResult } from 'src/schema/console';
import { $T } from 'src/i18n/utils/tFunc';

// TODO: 配色・UIの調整
// TODO: isMatchQueryがupdateSearch()の実行時と各行のコンソール描画時の２重に実行される問題の修正

const props = defineProps<{
  isVisible: boolean;
  consoleItems: ConsoleData[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'scrollToMatch', index: number): void;
}>();

const searchResults = defineModel<number[]>({ required: true });

const searchInput = ref('');
const currentMatchIndex = ref(-1);

// Computed property to get the current match count display
const matchCountText = computed(() => {
  if (searchResults.value.length === 0) return $T('console.search.noMatches');
  return $T('console.search.matchCount', {
    current: currentMatchIndex.value + 1,
    total: searchResults.value.length,
  });
});

/**
 * テキストを分割して検索クエリに一致する部分を特定する
 * @returns 分割されたテキストの配列（一致部分にはisMatchフラグが付く）
 */
function isMatchQuery(text: string): MatchResult[] {
  const query = searchInput.value;
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

// Perform the search through console items
function updateSearch() {
  if (!searchInput.value.trim()) {
    searchResults.value = [];
    currentMatchIndex.value = -1;
    return;
  }

  searchResults.value = props.consoleItems
    .map((item, index) =>
      isMatchQuery(item.chunk).some((res) => res.isMatch) ? index : -1
    )
    .filter((index) => index !== -1);

  currentMatchIndex.value = searchResults.value.length > 0 ? 0 : -1;

  if (currentMatchIndex.value >= 0) {
    navigateToMatch(currentMatchIndex.value);
  }
}

// Navigate to the next match
function nextMatch() {
  if (searchResults.value.length === 0) return;

  currentMatchIndex.value =
    (currentMatchIndex.value + 1) % searchResults.value.length;
  navigateToMatch(currentMatchIndex.value);
}

// Navigate to the previous match
function prevMatch() {
  if (searchResults.value.length === 0) return;

  currentMatchIndex.value =
    (currentMatchIndex.value - 1 + searchResults.value.length) %
    searchResults.value.length;
  navigateToMatch(currentMatchIndex.value);
}

// Emit event to scroll to the current match
function navigateToMatch(index: number) {
  emit('scrollToMatch', searchResults.value[index]);
}

// Close the search box
function closeSearch() {
  searchInput.value = '';
  searchResults.value = [];
  currentMatchIndex.value = -1;
  emit('close');
}

// Handle keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  if (!props.isVisible) return;

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

// Setup keyboard event listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// 公開メソッド
defineExpose({ isMatchQuery });
</script>

<template>
  <div v-if="isVisible" class="console-search">
    <div class="search-container">
      <q-input
        v-model="searchInput"
        @update:model-value="updateSearch()"
        dense
        outlined
        autofocus
        class="search-input"
        :placeholder="$T('console.search.placeholder')"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <div class="search-controls">
        <span class="match-count">{{ matchCountText }}</span>
        <q-btn
          flat
          round
          dense
          icon="keyboard_arrow_up"
          :disable="searchResults.length === 0"
          @click="prevMatch"
        />
        <q-btn
          flat
          round
          dense
          icon="keyboard_arrow_down"
          :disable="searchResults.length === 0"
          @click="nextMatch"
        />
        <q-btn flat round dense icon="close" @click="closeSearch" />
      </div>
    </div>
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
  font-size: 12px;
  margin-right: 8px;
}
</style>
