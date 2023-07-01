<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import PlayerIconInList from './utils/PlayerIconInList.vue';

const playerStore = usePlayerStore()
</script>

<template>
  <q-card flat class="q-my-md">
    <q-card-section horizontal>          
      <q-card-section class="row col q-pa-none">
        <div v-if="playerStore.focusCards.length === 0" class="row items-center">
          <p class="col q-my-none q-ml-sm text-caption text-grey">
            プレイヤーを上記から選択してください
          </p>
        </div>
        <template v-else v-for="uuid in playerStore.focusCards" :key="uuid">
          <PlayerIconInList :uuid="uuid" />
        </template>
      </q-card-section>

      <q-card-actions class="q-px-md">
        <q-btn
          outline
          label="選択解除"
          :disable="playerStore.focusCards.length === 0"
          @click="playerStore.unFocus()"
        />
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>