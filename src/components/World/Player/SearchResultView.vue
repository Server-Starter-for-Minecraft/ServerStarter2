<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { isValid } from 'src/scripts/error';
import { strSort } from 'src/scripts/objSort';
import SearchResultItem from './utils/SearchResultItem.vue';

const mainStore = useMainStore()
const playerStore = usePlayerStore()

/**
 * 与えられたPlayerリストに対して、
 * 
 * - Worldに登録済みのプレイヤー
 * - 検索名称に完全一致するプレイヤー
 * 
 * を除外したリストを返す
 */
function filterRegisteredPlayer(players: Player[]) {
  return players.filter(p => !(hasPlayerInWorld(p.uuid) || p.name === playerStore.searchName))
}

/**
 * uuidを渡したプレイヤーがすでにWorldに登録済みであるか否かを返す
 */
function hasPlayerInWorld(playerUUID?: PlayerUUID) {
  if (playerUUID !== void 0 && isValid(mainStore.world.players)) {
    return mainStore.world.players.some(wp => wp.uuid === playerUUID)
  }
  else {
    return true
  }
}
</script>

<template>
  
  <div
    v-if="(
      playerStore.searchPlayers(filterRegisteredPlayer(Object.values(playerStore.cachePlayers))).length
        + (!hasPlayerInWorld(playerStore.newPlayerCandidate?.uuid) ? 1 : 0)
      ) > 0"
    class="row q-gutter-sm q-pa-sm"
  > 
    <SearchResultItem
      v-if="playerStore.newPlayerCandidate !== void 0"
      v-show="!hasPlayerInWorld(playerStore.newPlayerCandidate?.uuid)"
      :player="playerStore.newPlayerCandidate"
    />
    <template
      v-for="player in playerStore.searchPlayers(filterRegisteredPlayer(Object.values(playerStore.cachePlayers))).sort((a, b) => strSort(a.name, b.name))"
      :key="player.uuid"
    >
      <SearchResultItem :player="player" />
    </template>
  </div>

  <div v-else class="full-width">
    <p class="q-my-xs text-center text-h5" style="opacity: .6;">検索結果無し</p>
  </div>
</template>