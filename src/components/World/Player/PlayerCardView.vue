<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import GroupBadgeView from './utils/GroupBadgeView.vue';
import PlayerHeadView from './utils/PlayerHeadView.vue';
import BasePlayerCard from './utils/BasePlayerCard.vue';

interface Prop {
  uuid: PlayerUUID
  opLevel?: 1 | 2 | 3 | 4
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const playerStore = usePlayerStore()
const playerData = sysStore.systemSettings().player.players[prop.uuid]

function onCardClicked() {
  if (playerStore.focusCards.includes(prop.uuid)) {
    playerStore.focusCards.splice(playerStore.focusCards.indexOf(prop.uuid), 1)
  }
  else {
    playerStore.focusCards.push(prop.uuid)
  }
}
</script>

<template>
  <BasePlayerCard
    @click="onCardClicked"
    :class="playerStore.focusCards.includes(prop.uuid) ? 'card-active' : ''"
  >
    <template #default>
      <q-item class="q-pa-md" style="height: 5.5rem;">
        <q-item-section avatar top>
          <player-head-view :player="playerData" size="2.5rem"/>
        </q-item-section>
    
        <q-item-section top>
          <q-item-label class="name">{{ playerData.name }}</q-item-label>
          <q-item-label v-show="opLevel !== void 0" caption class="q-pt-xs" style="opacity: 0.7;">
            権限レベル {{ opLevel }}
          </q-item-label>
        </q-item-section>
        <q-item-section side top>
          <q-icon :name="opLevel !== void 0 ? 'star' : ''"/>
        </q-item-section>
      </q-item>
    </template>

    <template #actions>
      <q-card-section class="q-py-none" style="width: max-content;">
        <span class="text-caption">所属グループ</span>
        <div class="q-gutter-sm q-py-xs" style="width: 12rem">
          <group-badge-view group-name="test" color="green"/>
          <group-badge-view group-name="testtesttesttest" color="green"/>
          <group-badge-view group-name="test" color="green"/>
        </div>
      </q-card-section>
    </template>
  </BasePlayerCard>
</template>

<style scoped lang="scss">
.card-active {
  border-color: $primary;
}

.name {
  font-size: 1.5rem;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
</style>