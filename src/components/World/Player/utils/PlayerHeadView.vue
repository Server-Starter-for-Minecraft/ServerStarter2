<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { checkError } from 'src/components/Error/Error';

interface Prop {
  uuid: PlayerUUID
  size?: string
}
const prop = defineProps<Prop>()
let playerData: Ref<Player | undefined> = ref()

onMounted(async () => {
  playerData.value = await getPlayerName()
})

async function getPlayerName() {
  const player = await window.API.invokeGetPlayer(prop.uuid, 'uuid')
  return checkError(player, undefined, 'プレイヤーの取得に失敗しました')
}
</script>

<template>
  <q-avatar square :size="size">
    <q-img :src="playerData?.avatar" class="avaterImg" />
    <q-img :src="playerData?.avatar_overlay" class="avaterImg" style="width: 110%;" />
  </q-avatar>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>