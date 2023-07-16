<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerIconInList from './utils/PlayerIconInList.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const playerStore = usePlayerStore()
</script>

<template>
  <q-card flat class="column q-mb-md" style="width: 13rem; flex: 1 1 0;">
    <p class="q-pa-sm q-ma-none text-body2">{{ $t('player.select', playerStore.focusCards.size) }}</p>
    
    <q-card-actions align="center">
      <SsBtn
        :label="$t('player.deselect',playerStore.focusCards.size)"
        :disable="playerStore.focusCards.size === 0"
        width="9rem"
        @click="playerStore.unFocus()"
      />
    </q-card-actions>
    
    <q-scroll-area
      style="flex: 1 1 0;"
    >
      <div class="row">
        <div v-if="playerStore.focusCards.size === 0" class="row items-center">
          <p class="col q-my-none q-ml-sm text-caption text-grey">
            {{ $t('player.selectPlayer') }}
          </p>
        </div>
        <template v-else v-for="uuid in playerStore.focusCards" :key="uuid">
          <PlayerIconInList :uuid="uuid" />
        </template>
      </div>
    </q-scroll-area>
  </q-card>
</template>