<script setup lang="ts">
import { Player } from 'app/src-electron/schema/player';

interface Prop {
  player: Player
  size?: string
}
defineProps<Prop>()
</script>

<template>
  <q-avatar square :size="size">
    <q-img :src="player.avatar" class="avaterImg" />
    <q-img :src="player.avatar_overlay" class="avaterImg" style="width: 110%;" />
  </q-avatar>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>