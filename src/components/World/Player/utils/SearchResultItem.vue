<script setup lang="ts">
import { Player } from 'app/src-electron/schema/player';
import PlayerHeadView from './PlayerHeadView.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  player: Player;
  registerBtnText: string;
  registerProcess: (player: Player) => void;
}
defineProps<Prop>();
</script>

<template>
  <q-item>
    <q-item-section avatar>
      <PlayerHeadView :player="player" />
    </q-item-section>
    <q-item-section top>
      <q-item-label class="name text-omit">
        {{ player.name }}
        <SsTooltip
          :name="player.name"
          anchor="bottom start"
          self="center start"
        />
      </q-item-label>
      <q-item-label caption class="q-pt-xs text-omit" style="opacity: 0.7"
        >uuid: {{ player.uuid }}</q-item-label
      >
    </q-item-section>
    <q-item-section side>
      <q-btn
        outline
        rounded
        :label="registerBtnText"
        icon="add"
        color="primary"
        @click="registerProcess(player)"
      />
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.name {
  font-size: 1.3rem;
}
</style>
