<script setup lang="ts">
import { isValid } from 'src/scripts/error';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import SearchResultCard from 'src/components/util/SearchResultCard.vue';
import PlayerJoinToggle from './core/PlayerJoinToggle.vue';

const sysStore = useSystemStore();
const mainStore = useMainStore();
const playerStore = usePlayerStore();

// ページを読み込んだ時に検索欄をリセット
playerStore.searchName = '';
</script>

<template>
  <div class="column q-gutter-y-md q-py-md">
    <span class="text-body2" style="opacity: 0.6">
      {{ $t('player.description') }}
    </span>

    <div class="row q-gutter-x-md">
      <SsInput
        v-model="playerStore.searchName"
        dense
        :placeholder="$t('player.search')"
        :debounce="200"
        class="col"
      />

      <SsSelect
        dense
        v-model="sysStore.systemSettings.user.viewStyle.player"
        :options="['list', 'card']"
      />

      <slot name="btnLine" />
    </div>

    <div class="row">
      <PlayerJoinToggle
        v-if="isValid(mainStore.world.properties)"
        v-model="mainStore.world.properties"
        class="col"
      />
      <SsBtn
        v-show="sysStore.systemSettings.user.viewStyle.player === 'list'"
        free-width
        :disable="playerStore.focusCards.size === 0"
        label="全ての選択を解除"
        @click="() => playerStore.unFocus()"
      />
    </div>

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
