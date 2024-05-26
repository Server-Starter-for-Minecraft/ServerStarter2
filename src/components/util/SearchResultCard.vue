<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { isValid } from 'src/scripts/error';
import { strSort } from 'src/scripts/objSort';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SearchResultItem from './core/SearchResultItem.vue';

interface Prop {
  registerBtnText: string;
  registerProcess: (player: Player) => void;
  // 表示中のワールドに対するプレイヤーの存在確認をするか
  isCheckPlayerInWorld?: boolean;
}
const prop = defineProps<Prop>();

const mainStore = useMainStore();
const playerStore = usePlayerStore();

/**
 * 与えられたPlayerリストに対して、
 *
 * - Worldに登録済みのプレイヤー
 * - 検索名称に完全一致するプレイヤー
 *
 * を除外したリストを返す
 */
function filterRegisteredPlayer(players: Player[]) {
  if (prop.isCheckPlayerInWorld) {
    return players.filter(
      (p) => !(hasPlayerInWorld(p.uuid) || p.name === playerStore.searchName)
    );
  }
  return players;
}

/**
 * uuidを渡したプレイヤーがすでにWorldに登録済みであるか否かを返す
 */
function hasPlayerInWorld(playerUUID?: PlayerUUID) {
  if (playerUUID !== void 0 && isValid(mainStore.world.players)) {
    return mainStore.world.players.some((wp) => wp.uuid === playerUUID);
  } else {
    return true;
  }
}
</script>

<template>
  <q-card flat bordered class="card q-ma-sm">
    <q-card-section
      v-if="
        playerStore.searchPlayers(
          filterRegisteredPlayer(Object.values(playerStore.cachePlayers))
        ).length +
          (!isCheckPlayerInWorld ||
          !hasPlayerInWorld(playerStore.newPlayerCandidate?.uuid)
            ? 1
            : 0) >
        0
      "
      class="q-pa-sm"
    >
      <q-list separator>
        <!-- プレイヤー名からプレイヤーの検索を行う -->
        <SearchResultItem
          v-if="playerStore.newPlayerCandidate !== void 0"
          v-show="
            !isCheckPlayerInWorld ||
            !hasPlayerInWorld(playerStore.newPlayerCandidate?.uuid)
          "
          :player="playerStore.newPlayerCandidate"
          :register-btn-text="registerBtnText"
          :register-process="registerProcess"
        />
        <!-- 過去に登録実績のあるプレイヤー一覧 -->
        <template
          v-for="p in playerStore
            .searchPlayers(
              filterRegisteredPlayer(Object.values(playerStore.cachePlayers))
            )
            .sort((a, b) => strSort(a.name, b.name))
            .filter((v) => playerStore.newPlayerCandidate?.name !== v.name)"
          :key="p"
        >
          <SearchResultItem
            :player="p"
            :register-btn-text="registerBtnText"
            :register-process="registerProcess"
          />
        </template>
      </q-list>
    </q-card-section>
    <q-card-section v-else>
      <p class="q-my-xs text-center">{{ $t('player.notFound') }}</p>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.body--light {
  .card {
    border-color: black;
  }
}

.body--dark {
  .card {
    border-color: white;
  }
}

.card {
  border-radius: 15px;
}
</style>
