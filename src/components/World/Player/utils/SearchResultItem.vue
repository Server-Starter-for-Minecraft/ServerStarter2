<script setup lang="ts">
import { Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerHeadView from './PlayerHeadView.vue';

const playerStore = usePlayerStore()
const playerModel = defineModel<Player>({ required: true })
</script>

<template>
  <q-item>
    <q-item-section avatar>
      <PlayerHeadView :player="playerModel" />
    </q-item-section>
    <q-item-section top>
      <q-item-label class="name text-omit">{{ playerModel.name }}</q-item-label>
      <q-item-label caption class="q-pt-xs text-omit" style="opacity: 0.7;">uuid: {{ playerModel.uuid }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-btn
        outline
        rounded
        :label="$t('player.addPlayer')"
        icon="add"
        color="primary"
        @click="playerStore.addPlayer(playerModel)"
      />
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.name {
  font-size: 1.3rem;
}
</style>