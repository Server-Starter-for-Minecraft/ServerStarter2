<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { checkError } from 'src/components/Error/Error';

interface Prop {
  size?: string
  uuid: PlayerUUID
  playerData?: Player
}
const prop = defineProps<Prop>()
const pData: Ref<Player | undefined> = ref()

onMounted(async () => {
  pData.value = prop.playerData ?? await getPlayerName()
})

async function getPlayerName() {
  const player = await window.API.invokeGetPlayer(prop.uuid, 'uuid')
  return checkError(player, undefined, 'プレイヤーの取得に失敗しました')
}
</script>

<template>
  <q-avatar square :size="size">
    <q-img :src="pData?.avatar" class="avaterImg" />
    <q-img :src="pData?.avatar_overlay" class="avaterImg" style="width: 110%;" />
  </q-avatar>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>