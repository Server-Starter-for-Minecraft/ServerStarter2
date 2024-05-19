<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsInput from 'src/components/util/base/ssInput.vue';

const playerStore = usePlayerStore();

// ページを読み込んだ時に検索欄をリセット
playerStore.searchName = '';
</script>

<template>
  <div>
    <span class="text-caption">{{ $t('owner.searchPlayer') }}</span>
    <SsInput
      v-model="playerStore.searchName"
      dense
      :placeholder="$t('player.search')"
      :debounce="200"
      class="q-pb-md col"
    />
  </div>
</template>
