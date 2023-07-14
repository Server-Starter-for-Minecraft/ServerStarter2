<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { checkError } from 'src/components/Error/Error';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import GroupBadgeView from './utils/GroupBadgeView.vue';
import PlayerHeadView from './utils/PlayerHeadView.vue';
import BaseActionsCard from '../utils/BaseActionsCard.vue';

interface Prop {
  uuid: PlayerUUID
  opLevel?: 1 | 2 | 3 | 4
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const playerStore = usePlayerStore()
const player = ref(playerStore.cachePlayers[prop.uuid])

// キャッシュデータに存在しないプレイヤーが指定された場合はデータの取得を行う
onMounted(async () => {
  if (player.value === void 0) {
    checkError(
      await window.API.invokeGetPlayer(prop.uuid, 'uuid'),
      p => {
        player.value = p
        playerStore.addPlayer(p)
      }
    )
  }
})

function onCardClicked() {
  if (playerStore.focusCards.has(prop.uuid)) {
    playerStore.unFocus(prop.uuid)
  }
  else {
    playerStore.addFocus(prop.uuid)
  }
}

function getGroups(groups: {[name: string]: PlayerGroup}) {
  return Object.keys(groups).filter(
    name => groups[name].players.includes(prop.uuid)
  ).map(
    name => { return { name: name, color: groups[name].color } }
  )
}
</script>

<template>
  <BaseActionsCard
    v-if="player !== void 0" @click="onCardClicked"
    :class="playerStore.focusCards.has(prop.uuid) ? 'card-active' : ''"
  >
    <template #default>
      <q-item class="q-pa-md" style="height: 5.5rem;">
        <q-item-section avatar top>
          <player-head-view v-model="player" size="2.5rem" />
        </q-item-section>

        <q-item-section top>
          <q-item-label class="name text-omit">{{ player.name }}</q-item-label>
          <q-item-label v-show="opLevel !== void 0" caption class="q-pt-xs" style="opacity: 0.7;">
            {{ $t('player.opLevel') }} {{ opLevel }}
          </q-item-label>
        </q-item-section>
        <q-item-section side top>
          <q-icon :name="opLevel !== void 0 ? 'star' : ''" />
        </q-item-section>
      </q-item>
    </template>

    <template #actions>
      <q-card-section
        v-show="getGroups(sysStore.systemSettings().player.groups).length > 0"
        class="q-py-none"
        style="width: max-content;"
      >
        <span class="text-caption">{{ $t("player.belongingGroup") }}</span>
        <div class="q-gutter-sm q-py-xs" style="width: 12rem">
          <template v-for="g in getGroups(sysStore.systemSettings().player.groups)" :key="g">
            <group-badge-view :group-name="g.name" :color="g.color" />
          </template>
        </div>
      </q-card-section>
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.card-active {
  border-color: $primary;
}

.name {
  font-size: 1.5rem;
}
</style>