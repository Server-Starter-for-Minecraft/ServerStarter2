<script setup lang="ts">
import { ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerHeadView from './utils/PlayerHeadView.vue';
import BaseActionsCard from '../utils/BaseActionsCard.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';

interface Prop {
  name: string
  color: string
  players: PlayerUUID[]
  onEdit: () => void
}
const prop = defineProps<Prop>()

const playerStore = usePlayerStore()
const showMenuBtn = ref(false)
const menuOpened = ref(false)

const cachePlayers = ref(playerStore.cachePlayers)

async function onCardClicked() {
  playerStore.selectGroup(prop.name)
}
</script>

<template>
  <BaseActionsCard
    @mouseover="showMenuBtn = true"
    @mouseout="showMenuBtn  = false"
    @click="onCardClicked"
  >
    <template #default>
      <q-card-section
        horizontal
        class="fit"
        :style="{'border-left': `1rem solid ${color}`, 'border-radius': '15px'}"
      >
        <q-card-section class="q-pt-sm q-pr-none" style="width: calc(100% - 3.5rem);">
          <div class="groupName">{{ name }}</div>

          <!-- TODO: 大量のプレイヤーが存在する（カードの高さが一定以上になる？）場合には折り畳みにすることを検討？ -->
          <div class="row q-gutter-md q-pt-sm">
            <template v-for="uuid in players" :key="uuid">
              <player-head-view v-model="cachePlayers[uuid]" size="1.5rem" />
            </template>
          </div>
        </q-card-section>
      </q-card-section>
    </template>

    <template #actions>
      <SsBtn
        v-show="showMenuBtn || menuOpened"
        dense
        label="編集"
        width="3rem"
        class="q-mt-sm q-mr-sm absolute-top-right"
        @click="onEdit"
      />
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.groupName {
  font-size: 1.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>