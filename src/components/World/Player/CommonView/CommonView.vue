<script setup lang="ts">
import { isValid } from 'src/scripts/error';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SearchResultCard from 'src/components/util/SearchResultCard.vue';
import PlayerJoinToggle from './core/PlayerJoinToggle.vue';

const mainStore = useMainStore();
const playerStore = usePlayerStore();

// ページを読み込んだ時に検索欄をリセット
playerStore.searchName = '';
</script>

<template>
  <div class="column q-gutter-y-sm q-pt-md">
    <span class="text-body2" style="opacity: 0.6">
      {{ $t('player.description') }}
    </span>

    <SsInput
      v-model="playerStore.searchName"
      dense
      :placeholder="$t('player.search')"
      :debounce="200"
    />

    <PlayerJoinToggle
      v-if="isValid(mainStore.world.properties)"
      v-model="mainStore.world.properties"
    />

    <div v-show="playerStore.searchName !== ''">
      <span class="text-caption">{{ $t('player.newPlayer') }}</span>
      <SearchResultCard
        is-check-player-in-world
        :register-btn-text="$t('player.addPlayer')"
        :register-process="playerStore.addPlayer"
      />
    </div>
  </div>
</template>
