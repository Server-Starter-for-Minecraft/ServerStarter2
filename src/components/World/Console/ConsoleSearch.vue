<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { $T } from 'src/i18n/utils/tFunc';

const props = defineProps<{
  isVisible: boolean;
  consoleItems: { chunk: string; isError: boolean }[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'scrollToMatch', index: number): void;
  (e: 'updateSearchResults', query: string, results: number[]): void; // 追加
}>();

const searchInput = ref('');
const searchResults = ref<number[]>([]);
const currentMatchIndex = ref(-1);
const searchInputRef = ref<HTMLInputElement | null>(null);

// Computed property to get the current match count display
const matchCountText = computed(() => {
  if (searchResults.value.length === 0) return $T('console.search.noMatches');
  return $T('console.search.matchCount', {
    current: currentMatchIndex.value + 1,
    total: searchResults.value.length,
  });
});

// Watch for changes in the search input to update search results
watch(searchInput, () => {
  performSearch();
});

// Watch for visibility changes to focus the input when shown
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue && searchInputRef.value) {
      setTimeout(() => {
        searchInputRef.value?.focus();
      }, 50);
    }
  }
);

// Perform the search through console items
function performSearch() {
  if (!searchInput.value.trim()) {
    searchResults.value = [];
    currentMatchIndex.value = -1;
    emit('updateSearchResults', '', []); // 検索クエリが空の場合
    return;
  }

  const query = searchInput.value.toLowerCase();
  searchResults.value = props.consoleItems
    .map((item, index) =>
      item.chunk.toLowerCase().includes(query) ? index : -1
    )
    .filter((index) => index !== -1);

  currentMatchIndex.value = searchResults.value.length > 0 ? 0 : -1;

  // 検索結果を親コンポーネントに伝える
  emit('updateSearchResults', searchInput.value, searchResults.value);

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
  emit('updateSearchResults', '', []); // 検索結果をクリア
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
</script>

<template>
  <div v-if="isVisible" class="console-search">
    <div class="search-container">
      <q-input
        ref="searchInputRef"
        v-model="searchInput"
        dense
        outlined
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
