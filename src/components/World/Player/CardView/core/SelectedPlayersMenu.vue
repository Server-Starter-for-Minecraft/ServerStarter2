<script setup lang="ts">
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerIcon from '../../utils/PlayerIcon.vue';

const playerStore = usePlayerStore();

function getOrderedFocusCards(cards: Set<PlayerUUID>) {
  return Array.from(cards).sort((a, b) => {
    const aName = playerStore.cachePlayers[a].name;
    const bName = playerStore.cachePlayers[b].name;
    return strSort(aName, bName);
  });
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

    <q-scroll-area style="flex: 1 1 0">
      <div class="row">
        <div v-if="playerStore.focusCards.size === 0" class="fit">
          <p class="col text-caption text-grey text-center">
            {{ $t('player.selectPlayerFromLeft') }}
          </p>
        </div>
        <div
          v-else
          v-for="uuid in getOrderedFocusCards(playerStore.focusCards)"
          :key="uuid"
          class="col-3"
        >
          <PlayerIcon
            hover-btn
            :uuid="uuid"
            :negative-btn-clicked="playerStore.unFocus"
          />
        </div>
      </div>
    </q-scroll-area>
  </q-card>
</template>
