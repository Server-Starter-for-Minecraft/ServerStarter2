<script setup lang="ts">
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { Player } from 'app/src-electron/schema/player';
import { $T } from 'src/i18n/utils/tFunc';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerIcon from './parts/PlayerIcon.vue';

const playerStore = usePlayerStore();

function getTitle() {
  // 特定の条件の場合のみ変更する場合はここに記載
  if (playerStore.openGroupEditor) return $T('player.groupMember');

  // デフォルト値
  return $T('player.select', playerStore.focusPlayerIds.size);
}

function getOrderedFocusCards(cards: Player[]) {
  return cards.sort((a, b) => strSort(a.name, b.name));
}
</script>

<template>
  <q-card flat class="column" style="width: 13rem; flex: 1 1 0">
    <p class="q-pt-sm q-pl-sm q-pa-none q-ma-none text-body2">
      {{ getTitle() }}
    </p>

    <q-card-actions class="q-mx-sm">
      <q-btn
        outline
        :label="$t('player.deselect', playerStore.focusPlayerIds.size)"
        :disable="playerStore.focusPlayerIds.size === 0"
        class="full-width q-my-xs"
        @click="playerStore.unFocus()"
      />
    </q-card-actions>

    <q-scroll-area class="q-px-sm" style="flex: 1 1 0">
      <div v-if="playerStore.focusPlayerIds.size === 0" class="fit">
        <p class="col text-caption text-grey text-center">
          {{ $t('player.selectPlayerFromLeft') }}
        </p>
      </div>
      <div v-else class="row q-gutter-md" style="padding-left: 0.5rem">
        <div
          v-for="p in getOrderedFocusCards(playerStore.focusPlayers)"
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
