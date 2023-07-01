<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';

interface Prop {
  uuid: PlayerUUID
  size?: string
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const playerData = sysStore.systemSettings().player.players[prop.uuid]
</script>

<template>
  <q-avatar square :size="size">
    <q-img :src="playerData.avatar" class="avaterImg" />
    <q-img :src="playerData.avatar_overlay" class="avaterImg" style="width: 110%;" />
  </q-avatar>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>