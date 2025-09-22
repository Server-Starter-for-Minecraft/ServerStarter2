<script setup lang="ts">
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerIcon from '../../utils/PlayerIcon.vue';

const playerStore = usePlayerStore();

function getOrderedFocusCards(cards: Set<Player>) {
  return Array.from(cards).sort((a, b) => strSort(a.name, b.name));
}
</script>

<template>
  <q-card flat class="column" style="width: 13rem; flex: 1 1 0">
    <p class="q-pt-sm q-pl-sm q-pa-none q-ma-none text-body2">
      {{ $t('player.select', playerStore.focusCards.size) }}
    </p>

    <q-card-actions class="q-mx-sm">
      <q-btn
        outline
        :label="$t('player.deselect', playerStore.focusCards.size)"
        :disable="playerStore.focusCards.size === 0"
        class="full-width q-my-xs"
        @click="playerStore.unFocus()"
      />
    </q-card-actions>

    <q-scroll-area class="q-px-sm" style="flex: 1 1 0">
      <div v-if="playerStore.focusCards.size === 0" class="fit">
        <p class="col text-caption text-grey text-center">
          {{ $t('player.selectPlayerFromLeft') }}
        </p>
      </div>
      <div v-else class="row q-gutter-md" style="padding-left: 0.5rem">
        <!-- TODO: loadedPlayersを新設し，LoadedPlayers.uuid != focusCards.uuid の時にはLoadingの表示とする？ -->
        <!-- PlayerIconはあくまでアイコン表示のラッパーのはずなのに，情報の取得までやるのはおかしい -->
        <!-- Iconを使用する際には上記のようにLoadedListを設けて対応する方針で各呼び出し箇所を修正する -->
        <div
          v-for="p in getOrderedFocusCards(playerStore.focusCards)"
          :key="p.uuid"
        >
          <PlayerIcon
            hover-btn
            enable-tooltip
            :player="p"
            :negative-btn-clicked="playerStore.unFocus"
          />
        </div>
      </div>
    </q-scroll-area>
  </q-card>
</template>
