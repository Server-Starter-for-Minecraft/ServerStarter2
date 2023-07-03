<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import { checkError } from 'src/components/Error/Error';
import GroupBadgeView from './utils/GroupBadgeView.vue';
import PlayerHeadView from './utils/PlayerHeadView.vue';
import BasePlayerCard from './utils/BasePlayerCard.vue';

interface Prop {
  modelValue: PlayerSetting[]
  uuid: PlayerUUID
  opLevel?: 1 | 2 | 3 | 4
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const playerModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

const playerStore = usePlayerStore()
let playerName = ref('')

onMounted(async () => playerName.value = (await getPlayerName()) ?? '')

function onCardClicked() {
  if (playerStore.focusCards.includes(prop.uuid)) {
    playerStore.unFocus(prop.uuid)
  }
  else {
    playerStore.addFocus(prop.uuid)
  }
}

async function getPlayerName() {
  const player = await window.API.invokeGetPlayer(prop.uuid, 'uuid')
  return checkError(player, undefined, 'プレイヤーの取得に失敗しました')?.name
}
</script>

<template>
  <BasePlayerCard @click="onCardClicked" :class="playerStore.focusCards.includes(prop.uuid) ? 'card-active' : ''">
    <template #default>
      <q-item class="q-pa-md" style="height: 5.5rem;">
        <q-item-section avatar top>
          <player-head-view :uuid="uuid" size="2.5rem" />
        </q-item-section>

        <q-item-section top>
          <q-item-label class="name">{{ playerName }}</q-item-label>
          <q-item-label v-show="opLevel !== void 0" caption class="q-pt-xs" style="opacity: 0.7;">
            権限レベル {{ opLevel }}
          </q-item-label>
        </q-item-section>
        <q-item-section side top>
          <q-icon :name="opLevel !== void 0 ? 'star' : ''" />
        </q-item-section>
      </q-item>
    </template>

    <template #actions>
      <q-card-section class="q-py-none" style="width: max-content;">
        <span class="text-caption">所属グループ</span>
        <div class="q-gutter-sm q-py-xs" style="width: 12rem">
          <group-badge-view v-model="playerModel" group-name="test" color="green" />
          <group-badge-view v-model="playerModel" group-name="testtesttesttest" color="green" />
          <group-badge-view v-model="playerModel" group-name="test" color="green" />
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>