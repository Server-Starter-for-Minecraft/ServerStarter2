<script setup lang="ts">
import { isValid } from 'app/src-public/scripts/error';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SearchResultCard from 'src/components/util/SearchResultCard.vue';
import PlayerJoinToggle from './core/PlayerJoinToggle.vue';
import ViewToggleBtn from './core/ViewToggleBtn.vue';

const inputResarchName = defineModel<string>({ required: true });

const mainStore = useMainStore();
const playerStore = usePlayerStore();

/**
 * uuidを渡したプレイヤーがすでにWorldに登録済みであるか否かを返す
 */
function hasPlayerInWorld(playerUUID?: PlayerUUID) {
  if (mainStore.world && isValid(mainStore.world.players)) {
    return mainStore.world.players.some((wp) => wp.uuid === playerUUID);
  } else {
    return false;
  }
}
</script>

<template>
  <div class="column q-gutter-y-md q-py-md">
    <span class="text-body2" style="opacity: 0.6">
      {{ $t('player.description') }}
    </span>

    <div class="row q-gutter-x-md items-center">
      <!-- 検索時に表示が絞られているにもかかわらず，非表示中のプレイヤー設定が書き換わらないように検索前にフォーカスを外しておく -->
      <SsInput
        v-model="inputResarchName"
        dense
        :placeholder="$t('player.search')"
        :debounce="200"
        class="col"
        @focus="playerStore.unFocus()"
      />

      <ViewToggleBtn />

      <slot name="btnLine" />
    </div>

    <div class="row">
      <PlayerJoinToggle
        v-if="mainStore.world && isValid(mainStore.world.properties)"
        v-model="mainStore.world.properties"
        class="col"
      />
      <slot name="toggleLine" />
    </div>

    <div v-show="inputResarchName !== ''">
      <span class="text-caption">{{ $t('player.newPlayer') }}</span>
      <SearchResultCard
        v-model="inputResarchName"
        is-check-player-in-world
        :register-btn-text="$t('player.addPlayer')"
        :register-process="playerStore.addPlayer"
        :player-filter="(pId) => !hasPlayerInWorld(pId)"
      />
    </div>
  </div>
</template>
