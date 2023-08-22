<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import SearchResultItem from 'src/components/World/Player/utils/SearchResultItem.vue';
import { $T } from 'src/i18n/utils/tFunc';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { strSort } from 'src/scripts/objSort'

const ownerCandidate = defineModel<PlayerUUID>()
const playerStore = usePlayerStore()

function setOwner(player: Player) {
  ownerCandidate.value = player.uuid
  // 検索欄のリセット
  playerStore.searchName = ''
}
</script>

<template>
  <div v-show="playerStore.searchName !== ''" class="q-pb-md">
    <span class="text-caption">{{ $T('owner.searchResult') }}</span>
    <q-card flat bordered class="card q-ma-sm">
      <q-card-section
        v-if="(
          playerStore.searchPlayers(Object.values(playerStore.cachePlayers)).length
            + (playerStore.newPlayerCandidate ? 1 : 0)
          ) > 0"
        class="q-pa-sm"
      >
        <q-list separator>
          <!-- プレイヤー名からプレイヤーの検索を行う -->
          <SearchResultItem
            v-if="playerStore.newPlayerCandidate !== void 0"
            :player="playerStore.newPlayerCandidate"
            :register-btn-text="$T('owner.registerPlayer')"
            :register-process="setOwner"
          />
          <!-- 過去に登録実績のあるプレイヤー一覧 -->
          <template
            v-for="
              p in playerStore.searchPlayers(
                Object.values(playerStore.cachePlayers)
              ).sort(
                (a, b) => strSort(a.name, b.name)
              )"
            :key="p"
          >
            <SearchResultItem
              :player="p"
              :register-btn-text="$T('owner.registerPlayer')"
              :register-process="setOwner"
            />
          </template>
        </q-list>
      </q-card-section>
      <q-card-section v-else>
        <p class="q-my-xs text-center">{{ $t('player.notFound') }}</p>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped lang="scss">
.card {
  // TODO: lightモードに対応
  border-color: white;
  border-radius: 15px;
}
</style>