<script setup lang="ts">
import { computed, Ref, ref } from 'vue';
import { isValid } from 'app/src-public/scripts/error';
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { useMainStore } from 'src/stores/MainStore';
import PlayerCard from './core/PlayerCard.vue';

const inputResarchName = defineModel<string>({ required: true });

const loadedPlayerSettings = computed(() => {
  const mainStore = useMainStore();
  if (mainStore.world && isValid(mainStore.world.players)) {
    return mainStore.world.players;
  }
  return [];
});

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

/**
 * 読み込み済みプレイヤー一覧から、検索ワードにマッチするプレイヤーのみを返す
 */
function filteredPlayers() {
  if (inputResarchName.value === '') {
    return loadedPlayerSettings.value;
  } else {
    return loadedPlayerSettings.value.filter((p) =>
      p.name.toLowerCase().match(inputResarchName.value.toLowerCase())
    );
  }
}
</script>

<template>
  <span class="text-caption">{{ $t('player.registeredPlayer') }}</span>
  <div v-if="loadedPlayerSettings.length !== 0" class="row q-gutter-sm q-pa-sm">
    <div
      v-for="player in filteredPlayers().sort(playerSortFunc(playerOrder))"
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
