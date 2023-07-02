<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import SearchResultItem from './utils/SearchResultItem.vue';

const mainStore = useMainStore()
const playerStore = usePlayerStore()
</script>

<template>
  <q-card flat bordered class="card q-ma-sm">
    <q-card-section class="q-pa-sm">
      <q-list separator>
        <!-- ここのUUIDには外部Serverから検索してきた結果のUUIDを入力する（UUIDではなく，直接名前とアバターを指定する？） -->
        <!-- <SearchResultItem :uuid="" /> -->
        <!-- TODO: 本来はsearchPlayersの引数には登録済みのプレイヤー全てを含んだリストを入れるべき -->
        <!-- この時に，既にWorldに登録済みのプレイヤーは候補への表示から除外する -->
        <template v-for="p in playerStore.searchPlayers(mainStore.world().players)" :key="p">
          <SearchResultItem :uuid="p.uuid" />
        </template>
      </q-list>
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