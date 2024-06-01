<script setup lang="ts">
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SearchResultItem from './core/SearchResultItem.vue';

interface Prop {
  registerBtnText: string;
  registerProcess: (player: Player) => void;
  /** trueの時に当該プレイヤーを表示する */
  playerFilter?: (pId?: PlayerUUID) => boolean;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();
const pFilter = (pId?: PlayerUUID) => {
  if (pId) {
    return prop.playerFilter?.(pId) ?? true;
  }
  return false
};

/**
 * 与えられたPlayerリストに対して、
 *
 * - Worldに登録済みのプレイヤー
 * - 検索名称に完全一致するプレイヤー
 *
 * を除外したリストを返す
 */
function filterRegisteredPlayer(players: Player[]) {
  return players.filter(
    (p) => pFilter(p.uuid) && p.name !== playerStore.searchName
  );
}
</script>

<template>
  <q-card flat bordered class="card q-ma-sm">
    <q-card-section
      v-if="
        playerStore.searchPlayers(
          filterRegisteredPlayer(Object.values(playerStore.cachePlayers))
        ).length +
          (pFilter(playerStore.newPlayerCandidate?.uuid) ? 1 : 0) >
        0
      "
      class="q-pa-sm"
    >
      <q-list separator>
        <!-- 検索ワードと完全一致のプレイヤーを表示 -->
        <SearchResultItem
          v-if="playerStore.newPlayerCandidate !== void 0"
          v-show="pFilter(playerStore.newPlayerCandidate?.uuid)"
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
