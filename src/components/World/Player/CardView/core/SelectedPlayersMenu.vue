<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { strSort } from 'src/scripts/objSort';
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
      <div class="row q-gutter-md q-pa-sm">
        <div v-if="playerStore.focusCards.size === 0" class="fit">
          <p class="col text-caption text-grey text-center">
            {{ $t('player.selectPlayerFromLeft') }}
          </p>
        </div>
        <template
          v-else
          v-for="uuid in getOrderedFocusCards(playerStore.focusCards)"
          :key="uuid"
        >
          <PlayerIcon
            show-name
            :uuid="uuid"
            :negative-btn-clicked="playerStore.unFocus"
          />
        </template>
      </div>
    </q-scroll-area>
  </q-card>
</template>
