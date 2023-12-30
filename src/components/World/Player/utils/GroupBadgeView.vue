<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

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
    clickable
    @click="onCardClicked"
  >
    <q-icon name="circle" :style="{'color': color}" />
    <span class="name text-omit">
      {{ groupName }}
      <SsTooltip :name="groupName" anchor="bottom start" self="center start" />
    </span>
  </q-chip>
</template>

<style scoped lang="scss">
.name {
  max-width: 12rem;
}
</style>