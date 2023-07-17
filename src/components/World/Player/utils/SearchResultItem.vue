<script setup lang="ts">
import { Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerCardBase from './PlayerCardBase.vue';

interface Prop {
  player: Player
}
defineProps<Prop>()

const playerStore = usePlayerStore()
</script>

<template>
  <PlayerCardBase
    :player="player"
    :label="player.uuid"
    :label-style="{'font-size': '.45rem'}"
    @click="playerStore.addPlayer(player)"
  >
    <template #title>
      <div class="row text-primary">
        <span class="force-one-line q-pr-xs" style="max-width: 5rem;">{{ player.name }}</span>
        <span class="text-caption" style="margin-top: auto;">を追加</span>
      </div>
    </template>
    <template #rightIcon>
      <q-icon name="add" size="2rem" />
    </template>
  </PlayerCardBase>
</template>

<style scoped lang="scss">
.force-one-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>