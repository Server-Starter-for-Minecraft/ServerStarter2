<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import PlayerHeadView from './utils/PlayerHeadView.vue';
import BasePlayerCard from './utils/BasePlayerCard.vue';

interface Prop {
  name: string
  color: string
  players: PlayerUUID[]
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const mainStore = useMainStore()
const playerStore = usePlayerStore()

function onCardClicked() {
  prop.players.forEach(uuid => {
    // プレイヤー一覧にグループメンバーが表示されていないときは一覧に追加
    if (!mainStore.world().players.map(p => p.uuid).includes(uuid)) {
      mainStore.world().players.push({ uuid: uuid })
    }
    
    // グループプレイヤー全員にFocusを当てる
    if (!playerStore.focusCards.includes(uuid)) {
      playerStore.focusCards.push(uuid)
    }
  });
}
</script>

<template>
  <!-- TODO: グループ名やメンバーの編集、グループの削除ができるメニューボタンを表示する -->
  <!-- 編集画面（グループ名とメンバー）はグループの新規作成時にも流用する -->
  <base-player-card @click="onCardClicked">
    <q-card-section
      horizontal
      style="border-left: 1.5rem solid blue; border-radius: 15px;"
    >
      <q-card-section class="q-pt-sm">
        <div class="groupName">{{ name }}</div>

        <!-- TODO: 大量のプレイヤーが存在する（カードの高さが一定以上になる？）場合には折り畳みにすることを検討？ -->
        <div class="row q-gutter-md q-pt-sm">
          <template v-for="uuid in players" :key="uuid">
            <player-head-view :uuid="uuid" size="1.5rem" />
          </template>
        </div>
      </q-card-section>
    </q-card-section>
  </base-player-card>
</template>

<style scoped lang="scss">
.groupName {
  font-size: 1.5rem;
}
</style>