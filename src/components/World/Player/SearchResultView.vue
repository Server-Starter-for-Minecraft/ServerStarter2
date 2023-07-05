<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { isValid } from 'src/scripts/error';
import SearchResultItem from './utils/SearchResultItem.vue';
import StaticSearchResultItem from './utils/StaticSearchResultItem.vue';

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
  if (isValid(mainStore.world.players)) {
    return mainStore.world.players.some(wp => wp.uuid === playerUUID)
  }
  else {
    return true
  }
}
</script>

<template>
  <q-card flat bordered class="card q-ma-sm">
    <q-card-section
      v-if="(
        playerStore.searchPlayers(filterRegisteredPlayer(Object.values(playerStore.cachePlayers))).length
          + (!hasPlayerInWorld(playerStore.newPlayerCandidate?.uuid) ? 1 : 0)
        ) > 0"
      class="q-pa-sm"
    >
      <q-list separator>
        <!-- プレイヤー名からプレイヤーの検索を行う -->
        <SearchResultItem
          v-if="playerStore.newPlayerCandidate !== void 0"
          v-show="!hasPlayerInWorld(playerStore.newPlayerCandidate?.uuid)"
          v-model="playerStore.newPlayerCandidate"
        />
        <!-- 過去に登録実績のあるプレイヤー一覧 -->
        <template
          v-for="p in playerStore.searchPlayers(filterRegisteredPlayer(Object.values(playerStore.cachePlayers)))"
          :key="p"
        >
          <StaticSearchResultItem :player="p" />
        </template>
      </q-list>
    </q-card-section>
    <q-card-section v-else>
      <p class="q-my-xs text-center">検索結果無し</p>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.card {
  // TODO: lightモードに対応
  border-color: white;
  border-radius: 15px;
}
</style>