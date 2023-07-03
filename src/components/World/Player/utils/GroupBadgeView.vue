<script setup lang="ts">
import { computed } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { checkError } from 'src/components/Error/Error';
import { usePlayerStore } from 'src/stores/WorldTabsStore';

interface Prop {
  modelValue: PlayerSetting[]
  groupName: string
  color: string
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

async function onCardClicked() {
  async function getPlayerName(uuid: PlayerUUID) {
    const player = await window.API.invokeGetPlayer(uuid, 'uuid')
    return checkError(player, undefined, 'プレイヤーの取得に失敗しました')?.name
  }
  
  playerStore.searchGroups()[prop.groupName].players.forEach(async (uuid) => {
    // プレイヤー一覧にグループメンバーが表示されていないときは一覧に追加
    if (!playerModel.value.map(p => p.uuid).includes(uuid)) {
      const playerName = await getPlayerName(uuid)
      playerModel.value.push({ uuid: uuid, name: playerName ?? 'No Player Name' })
    }

    // グループプレイヤー全員にFocusを当てる
    if (!playerStore.focusCards.includes(uuid)) {
      playerStore.focusCards.push(uuid)
    }
  });
}
</script>

<template>
  <q-chip
    square
    dense
    outline
    clickable @click="onCardClicked"
  >
    <q-icon name="circle" :color="color"/>
    <span class="name">{{ groupName }}</span>
  </q-chip>
</template>

<style scoped lang="scss">
.name {
  max-width: 12rem;
  white-space: nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
</style>