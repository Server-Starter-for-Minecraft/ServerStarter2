<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabsStore';

interface Prop {
  groupName: string
  color: string
}
const prop = defineProps<Prop>()

const playerStore = usePlayerStore()

async function onCardClicked() {
  playerStore.selectGroup(prop.groupName)
}
</script>

<template>
  <q-chip
    square
    dense
    outline
    clickable @click="onCardClicked"
  >
    <q-icon name="circle" :style="{'color': color}" />
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