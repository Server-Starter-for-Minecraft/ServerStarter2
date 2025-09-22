<script setup lang="ts">
import { onBeforeMount, Ref, ref } from 'vue';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { isValid } from 'app/src-public/scripts/error';
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerItem from './core/PlayerItem.vue';

const inputResarchName = defineModel<string>({ required: true });

const loadedPlayerSettings = ref<PlayerSetting[]>([]);

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

onBeforeMount(async () => {
  const mainStore = useMainStore();
  if (mainStore.world && isValid(mainStore.world.players)) {
    loadedPlayerSettings.value = deepcopy(mainStore.world.players);
  }
});
</script>

<template>
  <span class="text-caption">{{ $t('player.registeredPlayer') }}</span>
  <q-list v-if="loadedPlayerSettings.length !== 0">
    <PlayerItem
      v-for="player in filteredPlayers().sort(playerSortFunc(playerOrder))"
      :key="player.uuid"
      :uuid="player.uuid"
      :op-level="player.op?.level"
    />
  </q-list>
  <div
    v-else
    class="full-width text-center text-h5 q-py-xl"
    style="opacity: 0.6"
  >
    {{ $t('player.notRegistered') }}
  </div>
</template>
