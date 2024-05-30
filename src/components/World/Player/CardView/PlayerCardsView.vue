<script setup lang="ts">
import { Ref, ref } from 'vue';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerCard from './core/PlayerCard.vue';

const validPlayers = defineModel<PlayerSetting[]>({ required: true });

const playerStore = usePlayerStore();

const orderTypes = ['name', 'op'] as const;
const playerOrder: Ref<(typeof orderTypes)[number]> = ref('name');
function playerSortFunc(
  orderType: (typeof orderTypes)[number]
): (a: PlayerSetting, b: PlayerSetting) => number {
  switch (orderType) {
    case 'name':
      return (a: PlayerSetting, b: PlayerSetting) => strSort(a.name, b.name);
    case 'op':
      return (a: PlayerSetting, b: PlayerSetting) => {
        return (b.op?.level ?? 0) - (a.op?.level ?? 0);
      };
  }
}
</script>

<template>
  <span class="text-caption">{{ $t('player.registeredPlayer') }}</span>
  <div v-if="validPlayers.length !== 0" class="row q-gutter-sm q-pa-sm">
    <div
      v-for="player in deepcopy(playerStore.searchPlayers(validPlayers)).sort(
        playerSortFunc(playerOrder)
      )"
      :key="player.uuid"
      class="col-"
    >
      <PlayerCard :uuid="player.uuid" :op-level="player.op?.level" />
    </div>
  </div>
  <div
    v-else
    class="full-width text-center text-h5 q-py-xl"
    style="opacity: 0.6"
  >
    {{ $t('player.notRegistered') }}
  </div>
</template>
