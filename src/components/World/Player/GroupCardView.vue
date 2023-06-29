<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import PlayerHeadView from './utils/PlayerHeadView.vue';

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
  <q-card
    flat
    bordered
    class="q-ma-xs fit card"
  >
    <q-card-section horizontal>
      <q-separator vertical class="q-pa-md q-ma-none" :style="{'background-color': color}" />
  
      <q-card-section top>
        <div class="groupName">{{ name }}</div>
        
        <!-- TODO: 大量のプレイヤーが存在する（カードの高さが一定以上になる？）場合には折り畳みにすることを検討？ -->
        <div class="row q-gutter-md">
          <template v-for="uuid in players" :key="uuid">
            <player-head-view
              :player="sysStore.systemSettings().player.players[uuid]"
              size="1.5rem"
            />
          </template>
        </div>
      </q-card-section>
    </q-card-section>

    <div class="absolute-top fit">
      <q-btn flat color="transparent" @click="onCardClicked" class="fit"/>
    </div>
    
  </q-card>
</template>

<style scoped lang="scss">
.card {
  min-width: 14rem;
  max-width: 14rem;
}

.groupName {
  font-size: 1.5rem;
}
</style>