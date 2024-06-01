<script setup lang="ts">
import { isValid } from 'app/src-public/scripts/error';
import { PlayerUUID } from 'app/src-electron/schema/brands';
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

/**
 * uuidを渡したプレイヤーがすでにWorldに登録済みであるか否かを返す
 */
function hasPlayerInWorld(playerUUID?: PlayerUUID) {
  if (isValid(mainStore.world.players)) {
    return mainStore.world.players.some((wp) => wp.uuid === playerUUID);
  } else {
    return false;
  }
}

/**
 * View形式が変更された際に発火
 */
function onChangedView() {
  playerStore.openGroupEditor = false;
}
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
        @update:model-value="onChangedView"
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
        :player-filter="(pId) => !hasPlayerInWorld(pId)"
      />
    </div>
  </div>
</template>
