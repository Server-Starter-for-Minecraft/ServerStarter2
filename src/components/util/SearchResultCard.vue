<script setup lang="ts">
import { ref, watch } from 'vue';
import { isValid } from 'app/src-public/scripts/error';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import SearchResultItem from './core/SearchResultItem.vue';

interface Prop {
  registerBtnText: string;
  registerProcess: (player: Player) => void;
  /** trueの時に当該プレイヤーを表示する */
  playerFilter?: (pId?: PlayerUUID) => boolean;
}
const prop = defineProps<Prop>();
const searchNameModel = defineModel<string>({ required: true });

const loadedSearchedPlayers = ref<Player[]>([]);

const pFilter = (pId?: PlayerUUID) => {
  if (pId) {
    return prop.playerFilter?.(pId) ?? true;
  }
  return false;
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
    (p) => pFilter(p.uuid) && p.name !== searchNameModel.value
  );
}

// 検索ワードの変更があるたびに window.api.invokeResearchPlayer() を呼び出す
// 呼び出し結果はloadedSearchedPlayersに格納し、画面に検索結果を表示する
watch(
  () => searchNameModel.value,
  async (newVal) => {
    if (newVal && newVal.trim() !== '') {
      // API呼び出し
      const [results, special] = await Promise.all([
        window.API.invokeResearchPlayer(newVal),
        window.API.invokeGetPlayer(newVal, 'name'),
      ]);
      // 検索履歴のあるプレイヤー一覧
      if (isValid(results)) {
        // 除外プレイヤーをフィルタリングして格納
        loadedSearchedPlayers.value = filterRegisteredPlayer(results);
      }
      // 検索名称に完全一致するプレイヤーを追加（上記一覧に存在しない場合に追加）
      if (
        isValid(special) &&
        !loadedSearchedPlayers.value.some((p) => p.uuid === special.uuid)
      ) {
        loadedSearchedPlayers.value.push(special);
      }
    } else {
      loadedSearchedPlayers.value = [];
    }
  },
  { immediate: true }
);
</script>

<template>
  <q-card flat bordered class="card q-ma-sm">
    <q-card-section v-if="loadedSearchedPlayers.length > 0" class="q-pa-sm">
      <q-list separator>
        <template v-for="p in loadedSearchedPlayers" :key="p">
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
