<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerIconInList from './utils/PlayerIconInList.vue';

const playerStore = usePlayerStore()
</script>

<template>
  <q-card flat class="q-my-md">
    <q-card-section horizontal>
      <q-card-section class="row col q-pa-none">
        <div v-if="playerStore.focusCards.size === 0" class="row items-center">
          <p class="col q-my-none q-ml-sm text-caption text-grey">
            {{ $t("player.selectPlayer") }}
          </p>
        </div>
        <template v-else v-for="uuid in playerStore.focusCards" :key="uuid">
          <PlayerIconInList :uuid="uuid" />
        </template>
      </q-card-section>

      <q-card-actions class="q-px-md">
        <q-btn
          outline
          :label="$t('player.deselect')"
          :disable="playerStore.focusCards.size === 0"
          @click="playerStore.unFocus()"
        />
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>